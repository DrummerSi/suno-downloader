import "./App.css";

import * as path from "@tauri-apps/api/path"

import { ActionIcon, AppShell, Badge, Box, Button, CloseButton, Divider, Flex, Group, Image, NavLink, Paper, Popover, Progress, Stack, Table, Text, TextInput, Title } from "@mantine/core"
import { IconAdjustments, IconBrandGithub, IconCoffee, IconFolder, IconFolderFilled, IconHelpCircle, IconHelpCircleFilled, IconLink, IconVinyl } from "@tabler/icons-react";
import Suno, { IPlaylist, IPlaylistClip, IPlaylistClipStatus } from "./services/Suno";
import { addImageToMp3, deletePath, ensureDir, existsFile, writeFile } from "./services/RustFunctions";
import { showError, showSuccess } from "./services/Utils";
import { useEffect, useRef, useState } from "react";

import Footer from "./components/Footer";
import Logger from "./services/Logger";
import SectionHeading from "./components/SectionHeading";
import { Settings } from "./services/SettingsManager";
import SettingsPanel from "./components/OptionsModal";
import StatusIcon from "./components/StatusIcon";
import { exists } from "@tauri-apps/plugin-fs"
import { exit } from '@tauri-apps/plugin-process'
import { fetch } from "@tauri-apps/plugin-http"
import filenamify from "filenamify"
import { invoke } from "@tauri-apps/api/core";
import { modals } from "@mantine/modals";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import pLimit from "p-limit"
import scrollIntoView from "scroll-into-view-if-needed"
import { sendNotification } from "@tauri-apps/plugin-notification";

function App() {

    const [playlistUrl, setPlaylistUrl] = useState("")
    const [saveFolder, setSaveFolder] = useState("")
    const [isGettingPlaylist, setIsGettingPLaylist] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [downloadPercentage, setDownloadPercentage] = useState(0)
    const [completedItems, setCompletedItems] = useState(0)

    const songTable = useRef<HTMLTableElement>(null);

    const [playlistData, setPlaylistData] = useState<IPlaylist | null>(null)
    const [playlistClips, setPlaylistClips] = useState<IPlaylistClip[]>([])

    const [footerView, setFooterView] = useState<1 | 2>(1)

    const getPlaylist = async () => {
        setIsGettingPLaylist(true)
        setPlaylistData(null)
        setPlaylistClips([])
        try {
            const data = await Suno.getSongsFromPlayList(playlistUrl)
            setPlaylistData(data[0])
            setPlaylistClips(data[1])
        } catch (err) {
            console.log(err)
            showError("Failed to fetch playlist data. Make sure you entered a valid link")
        }
        setIsGettingPLaylist(false)

        //Log the details
        Logger.log({
            playlistUrl: playlistUrl,
            noSongs: playlistClips.length
        })
    }

    const selectOutputFolder = async () => {
        const dir = await openDialog({
            title: "Select Output Folder",
            directory: true,
            canCreateDirectories: true
        })
        if (dir) setSaveFolder(dir)
    }

    const updateClipStatus = (id: string, status: IPlaylistClipStatus) => {
        setPlaylistClips((prevClips) =>
            prevClips.map((clip) =>
                clip.id === id ? { ...clip, status: status } : clip
            )
        )
    }

    const scrollToRow = (row: string) => {
        const node = songTable.current?.querySelector(`tr[data-id="row-${row}"]`)
        if (node) scrollIntoView(node, {
            scrollMode: "if-needed",
            behavior: "smooth",
            block: "end"
        })
    }

    const getSongName = (song: IPlaylistClip, template: string, outputDir: string) => {
        const songNumber = song.no.toString().padStart(2, "0")
        const songTitle = filenamify(song.title)

        const songName = template.replace("{trackno}", songNumber).replace("{name}", songTitle)
        return `${outputDir}\\${songName}.mp3`
    }

    const downloadPlaylist = async () => {
        setDownloadPercentage(0)
        setCompletedItems(0)
        setIsDownloading(true)

        //TODO: Proper error checking
        if (!playlistData || !playlistClips) return

        //Create the output directory if it doesn't exist
        const outputDir = await path.join(saveFolder, filenamify(playlistData.name))
        const tmpDir = await path.join(outputDir, "tmp")
        await ensureDir(outputDir)
        await ensureDir(tmpDir)

        //Reset the status of all clips
        setPlaylistClips((prevClips) =>
            prevClips.map((clip) => ({ ...clip, status: IPlaylistClipStatus.None }))
        )

        //Load settings
        const settings = await Settings.loadAll()

        const limit = pLimit(5)
        const downloadPromises = playlistClips.map((song) => {
            return limit(async () => {
                updateClipStatus(song.id, IPlaylistClipStatus.Processing)

                scrollToRow(song.id)

                const songFileName = getSongName(song, settings.name_templates, outputDir)
                if (settings.overwrite_files === "false" && await existsFile(songFileName)) {
                    //Skip writing file if it already exists and options tell us to skip
                    updateClipStatus(song.id, IPlaylistClipStatus.Skipped)

                } else {

                    // ─── For Testing Only ────────────────────────
                    //await delay(getRandomBetween(800, 2000))

                    // ─── Live Downloading ────────────────────────
                    const response = await fetch(song.audio_url)
                    if (response.status !== 200) {
                        console.log("Failed to download song", song.audio_url)
                        updateClipStatus(song.id, IPlaylistClipStatus.Error)
                        return //continue
                    }

                    const songBuffer = await response.arrayBuffer()
                    writeFile(songFileName, songBuffer)

                    if (settings.embed_images === "true") {
                        //Try and download and inject the mp3 image
                        const response2 = await fetch(song.image_url)
                        if (response2.status === 200) {
                            const imageBuffer = await response2.arrayBuffer()
                            const imageFileName = `${tmpDir}\\${filenamify(song.id)}.jpg`
                            writeFile(imageFileName, imageBuffer)
                            addImageToMp3(songFileName, imageFileName)
                        }
                    }

                    updateClipStatus(song.id, IPlaylistClipStatus.Success)

                }

                setCompletedItems((completedItems) => completedItems + 1)

            })
        })

        await Promise.all(downloadPromises)

        setIsDownloading(false)
        deletePath(tmpDir)

        //openCompleteModal()
        showSuccess("Playlist downloaded successfully")
    }

    const formatSecondsToTime = (seconds: number) => {
        const roundedSeconds = Math.round(seconds)
        const mins = Math.floor(roundedSeconds / 60)
        const secs = roundedSeconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    useEffect(() => {
        const initSavePath = async () => {
            const defaultSavePath = await path.audioDir()
            setSaveFolder(defaultSavePath)
        }
        initSavePath()
    }, [])

    useEffect(() => {
        //If we're downloading, show the download progress
        if (isDownloading) {
            setFooterView(2)
        } else {
            setFooterView(1)
        }
    }, [isDownloading])


    useEffect(() => {
        const totalItems = playlistClips.length
        const newPercentage = Math.ceil((completedItems / totalItems) * 100)
        setDownloadPercentage(newPercentage)
    }, [completedItems])

    const openCompleteModal = () => modals.open({
        title: 'Operation complete',
        centered: true,
        withCloseButton: false,
        children: (
            <Stack gap={20}>
                <Text>Your playlist has been downloaded successfully</Text>
                <Flex justify="flex-end">
                    <Button onClick={() => modals.closeAll()}>Close</Button>
                </Flex>
            </Stack>
        )
    });

    return (
        <AppShell
            header={{ height: 50 }}
            padding="lg"
        >
            <AppShell.Header>
                <Box h="100%" data-tauri-drag-region>
                    <Flex justify="space-between" h="100%" w="100%" data-tauri-drag-region>
                        <Flex
                            h="100%"
                            w="100%"
                            justify="flex-start"
                            align="center"
                            style={{
                                userSelect: "none",
                            }}
                            data-tauri-drag-region>
                            <Group gap={6} ml={10}>
                                <IconVinyl />
                                <Text>Suno Music Downloader</Text>
                            </Group>
                        </Flex>
                        <CloseButton onClick={() => exit(1)} />
                    </Flex>
                </Box>
            </AppShell.Header>
            <AppShell.Main
                style={{
                    display: "flex",
                    flexDirection: "column", // Stacks children vertically
                    height: "100vh", // Full height of the viewport
                    overflow: "hidden", // Prevent overall layout overflow
                }}
            >
                {/* Top Section */}
                <Flex justify="space-between">
                    <SectionHeading number="1" title="Paste playlist link">
                        <Popover position="bottom-start" withArrow shadow="lg">
                            <Popover.Target>
                                <ActionIcon variant="subtle" size="sm" color="gray"><IconHelpCircle /></ActionIcon>
                            </Popover.Target>
                            <Popover.Dropdown>
                                <Group w={240} gap={4}>
                                    <Image radius="md" src="./assets/copy-playlist.png" />
                                    <Text>Navigate to your Suno playlist, and click the 'Copy playlist' button as shown</Text>
                                </Group>
                            </Popover.Dropdown>
                        </Popover>
                    </SectionHeading>

                    <SettingsPanel />


                </Flex>

                <Flex gap="sm" direction="row" mb={20}>
                    <TextInput
                        flex={1}
                        value={playlistUrl}
                        onChange={(event) => setPlaylistUrl(event.currentTarget.value)}
                        rightSection={<IconLink />}
                        disabled={isGettingPlaylist || isDownloading}
                    />
                    <Button
                        variant="filled"
                        loading={isGettingPlaylist}
                        onClick={getPlaylist}
                        disabled={isGettingPlaylist || isDownloading}
                    >
                        Get playlist songs
                    </Button>
                </Flex>

                {/* Central Section */}
                <SectionHeading number="2" title="Review songs" />
                <Flex
                    bg="dark.8"
                    mb={20}
                    style={{
                        flex: 1, // This grows to occupy remaining space
                        overflowY: "auto", // Scrollable if content exceeds
                        padding: "1rem", // Optional padding
                        borderRadius: "0.5rem",
                        flexFlow: "column"
                    }}
                >
                    <Table verticalSpacing="sm" ref={songTable}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Img</Table.Th>
                                <Table.Th>Title</Table.Th>
                                <Table.Th style={{ textAlign: "right" }}>Length</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {playlistData && playlistClips?.map((clip) => (
                                <Table.Tr key={clip.id} data-id={`row-${clip.id}`}>
                                    <Table.Td w={50}>
                                        <Image radius="sm" w={40} fit="contain" src={clip.image_url} />
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={0}>
                                            <Group gap={0}>
                                                <Text
                                                    fw={800} size="md"
                                                // variant="gradient"
                                                // gradient={{ from: "grape", to: "teal", deg: 45 }}
                                                >
                                                    {clip.title}
                                                </Text>
                                                <Badge size="xs"
                                                    variant="gradient"

                                                    gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                                    ml={6}
                                                >{clip.model_version}</Badge>
                                            </Group>
                                            <Text size="sm" c="dimmed" lineClamp={1}>{clip.tags}</Text>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: "right" }}>
                                        <Text ff="monospace">
                                            {formatSecondsToTime(clip.duration)}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: "center" }}>
                                        <StatusIcon status={clip.status} />
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Flex>

                {/* Bottom Section */}
                <SectionHeading number="3" title="Select folder and download">
                    <Popover position="bottom-start" withArrow shadow="lg">
                        <Popover.Target>
                            <ActionIcon variant="subtle" size="sm" color="gray"><IconHelpCircle /></ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown w={240}>
                            <Text>
                                In the selected directory, a new folder will be created with the playlist name. This folder will contain the downloaded songs.
                            </Text>
                        </Popover.Dropdown>
                    </Popover>
                </SectionHeading>
                <Flex gap="sm" direction="row" mb={20}>

                    <TextInput
                        flex={1}
                        value={saveFolder}
                        disabled={isDownloading}
                        readOnly
                        onClick={selectOutputFolder}
                        leftSection={<IconFolderFilled />}
                        style={{
                            pointer: "cursor",
                        }}
                    />
                    <Button
                        variant="filled"
                        disabled={isGettingPlaylist || isDownloading || (!playlistData)}
                        loading={isDownloading}
                        onClick={downloadPlaylist}
                    >
                        Download songs
                    </Button>
                </Flex>

                <Box mb={20} display="none">
                    <hr />
                    <Group>
                        <h4>Debug commands:</h4>
                        <Button onClick={async () => {
                            await Logger.log({
                                noSongs: 12,
                                playlistUrl: "http://www.fred.com"
                            })
                            alert(await Logger.getUserId())
                        }}>Send test log</Button>
                        <Button onClick={async () => {
                            alert(await Logger.getUserId())
                        }}>Get user id</Button>
                        <Button onClick={async () => {
                            const settings = await Settings.loadAll()
                            console.log(settings)
                        }}>Settings test</Button>
                    </Group>

                    <hr />
                </Box>

                <Footer
                    firstComponent={
                        <Group gap={6}>
                            <Button leftSection={<IconBrandGithub />} variant="subtle" size="xs" component="a" href="http://www.github.com" target="_blank">Open source</Button>
                            <Divider orientation="vertical" />
                            <Button leftSection={<IconCoffee />} variant="subtle" size="xs" component="a" href="https://ko-fi.com/drummer_si" target="_blank">Buy me a coffee</Button>
                        </Group>
                    }
                    secondComponent={
                        <Stack
                            w="100%"
                            h={140}
                            gap={4}
                            pb={10}
                            mt={-5}
                        >
                            <Flex>
                                <Text size="xs">{downloadPercentage}%</Text>
                            </Flex>
                            <Progress value={downloadPercentage} animated />
                        </Stack>
                    }
                    currentView={footerView}
                />
            </AppShell.Main>
        </AppShell >
    )
}

export default App;
