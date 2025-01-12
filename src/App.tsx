import "./App.css";

import * as path from "@tauri-apps/api/path"

import { ActionIcon, AppShell, Badge, Box, Button, CloseButton, Divider, FileInput, Flex, Group, Image, NavLink, Paper, Popover, Progress, Stack, Table, Text, TextInput, Title } from "@mantine/core"
import { BaseDirectory, create } from "@tauri-apps/plugin-fs";
import { IconBrandGithub, IconCoffee, IconFolder, IconFolderFilled, IconHelp, IconHelpCircle, IconHelpCircleFilled, IconHelpSmall, IconLink, IconSolarElectricity, IconVinyl } from "@tabler/icons-react";
import Suno, { IPlaylist, IPlaylistClip, IPlaylistClipStatus } from "./services/Suno";
import { addImageToMp3, deletePath, ensureDir, writeFile } from "./services/RustFunctions";
import { delay, getRandomBetween, showError, showSuccess } from "./services/Utils";
import { useEffect, useRef, useState } from "react";

import Footer from "./components/Footer";
import SectionHeading from "./components/SectionHeading";
import StatusIcon from "./components/StatusIcon";
import { exit } from '@tauri-apps/plugin-process'
import { fetch } from "@tauri-apps/plugin-http"
import filenamify from "filenamify"
import { invoke } from "@tauri-apps/api/core";
import { modals } from "@mantine/modals";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import pLimit from "p-limit"
import reactLogo from "./assets/react.svg";
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

        const limit = pLimit(5)
        const downloadPromises = playlistClips.map((song) => {
            return limit(async () => {
                updateClipStatus(song.id, IPlaylistClipStatus.Processing)

                scrollToRow(song.id)

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
                const songFileName = `${outputDir}\\${song.no.toString().padStart(2, "0")} - ${filenamify(song.title)}.mp3`
                writeFile(songFileName, songBuffer)
                //Try and download and inject the mp3 image
                const response2 = await fetch(song.image_url)
                if (response2.status === 200) {
                    const imageBuffer = await response2.arrayBuffer()
                    const imageFileName = `${tmpDir}\\${filenamify(song.id)}.jpg`
                    writeFile(imageFileName, imageBuffer)
                    addImageToMp3(songFileName, imageFileName)
                }

                // ─── Update The Playlist Data ────────────────
                updateClipStatus(song.id, IPlaylistClipStatus.Success)
                setCompletedItems((completedItems) => completedItems + 1)
                // const newPercentage = Math.ceil((song.no / playlistClips.length) * 100)
                // if (newPercentage > downloadPercentage) setDownloadPercentage(newPercentage)
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


    // const updatePercentage = () => {
    //     const totalItems = playlistClips.length
    //     const completedItems = playlistClips.filter((clip) =>
    //         clip.status === IPlaylistClipStatus.Success
    //     ).length

    //     console.log(JSON.stringify(playlistClips.filter((clip) =>
    //         clip.status === IPlaylistClipStatus.Success
    //     ), null, 4))

    //     const percentage = Math.ceil((completedItems / totalItems) * 100)
    //     console.log(playlistClips, totalItems, completedItems, percentage)
    //     setDownloadPercentage(percentage)
    // }

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

// function App2() {
//     const [greetMsg, setGreetMsg] = useState("");
//     const [name, setName] = useState("");

//     async function greet() {
//         // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
//         setGreetMsg(await invoke("greet", { name }));
//     }

//     async function download() {

//         const response = await fetch("https://cdn1.suno.ai/2023b630-359f-4d44-9529-60c3b472c79a.mp3", {
//             method: "GET",
//         });
//         if (response.status !== 200) {
//             throw new Error("Failed to fetch the file.");
//         }

//         const fileData = new Uint8Array(await response.arrayBuffer())
//         await writeFile('test.mp3', fileData, { baseDir: BaseDirectory.Desktop })

//         console.log("SAVED")

//         sendNotification({
//             title: "Song downloaded",
//             body: "Song downloaded successfully",
//         })

//         // const file = await create('test.mp3', { baseDir: BaseDirectory.Desktop })
//         // await file.write(response.arrayBuffer)
//         // await file.close()
//         // console.log(response)


//         // const response = await fetch("https://cdn1.suno.ai/2023b630-359f-4d44-9529-60c3b472c79a.mp3", {
//         //     method: "GET",
//         //     //responseType: "ArrayBuffer", // Use ArrayBuffer for binary files
//         // });

//         // if (!response.data) {
//         //     throw new Error("Failed to fetch the file.");
//         // }

//         // const savePath = await dialog.save({
//         //     title: "Save File As",
//         //     defaultPath: "downloaded_file", // Default filename
//         // });

//         // if (!savePath) {
//         //     console.log("Save operation cancelled.");
//         //     return;
//         // }

//         // Step 3: Write the file to the selected location
//         // const fileData = new Uint8Array(response.data); // Convert ArrayBuffer to Uint8Array
//         // await fs.writeBinaryFile(savePath, fileData);

//         //console.log(`File successfully saved to: ${savePath}`);


//     }

//     return (
//         <main className="container">
//             <h1>Welcome to Tauri + React</h1>

//             <div className="row">
//                 <a href="https://vitejs.dev" target="_blank">
//                     <img src="/vite.svg" className="logo vite" alt="Vite logo" />
//                 </a>
//                 <a href="https://tauri.app" target="_blank">
//                     <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
//                 </a>
//                 <a href="https://reactjs.org" target="_blank">
//                     <img src={reactLogo} className="logo react" alt="React logo" />
//                 </a>
//             </div>
//             <p>Click on the Tauri, Vite, and React logos to learn more.</p>

//             <form
//                 className="row"
//                 onSubmit={(e) => {
//                     e.preventDefault();
//                     greet();
//                 }}
//             >
//                 <input
//                     id="greet-input"
//                     onChange={(e) => setName(e.currentTarget.value)}
//                     placeholder="Enter a name..."
//                 />
//                 <button type="submit">Greet</button>

//                 <button onClick={download}>DOWNLOAD</button>
//             </form>
//             <p>{greetMsg}</p>
//         </main>
//     );
// }

export default App;
