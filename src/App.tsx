import "./App.css";

import * as path from "@tauri-apps/api/path"

import { AppShell, Badge, Button, FileInput, Flex, Group, Image, Paper, Stack, Table, Text, TextInput } from "@mantine/core"
import { BaseDirectory, create } from "@tauri-apps/plugin-fs";
import { IconFolder, IconFolderFilled, IconLink, IconSolarElectricity } from "@tabler/icons-react";
import Suno, { IPlaylist } from "./services/Suno";
import { useEffect, useState } from "react";

import { fetch } from "@tauri-apps/plugin-http"
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import reactLogo from "./assets/react.svg";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { writeFile } from "./RustFunctions";

function App() {

    const [playlistUrl, setPlaylistUrl] = useState("https://suno.com/playlist/8ebe794f-d640-46b6-bde8-121622e1a4c2")
    const [saveFolder, setSaveFolder] = useState("")
    const [isGettingPlaylist, setIsGettingPLaylist] = useState(false)

    const [playlistData, setPlaylistData] = useState<IPlaylist | null>(null)

    const getPlaylist = async () => {
        setIsGettingPLaylist(true)
        try {
            const data = await Suno.getSongsFromPlayList(playlistUrl)
            setPlaylistData(data)
        } catch (err) {
            console.log(err)
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

    return (
        <AppShell
            header={{ height: 60 }}
            padding="lg"
        >
            <AppShell.Header>
                <div>LOGO</div>
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
                <Flex gap="sm" direction="row" pb={10}>
                    <TextInput
                        flex={1}
                        value={playlistUrl}
                        onChange={(event) => setPlaylistUrl(event.currentTarget.value)}
                        rightSection={<IconLink />}
                    />
                    <Button
                        variant="filled"
                        loading={isGettingPlaylist}
                        onClick={getPlaylist}
                    >
                        Get playlist songs
                    </Button>
                </Flex>

                {/* Central Section */}
                <Flex
                    bg="dark.8"
                    style={{
                        flex: 1, // This grows to occupy remaining space
                        overflowY: "auto", // Scrollable if content exceeds
                        padding: "1rem", // Optional padding
                        borderRadius: "0.5rem",
                        flexFlow: "column"
                    }}
                >
                    <Table verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Img</Table.Th>
                                <Table.Th>Title</Table.Th>
                                <Table.Th style={{ textAlign: "right" }}>Length</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {playlistData && playlistData.clips?.map((clip, idx) => (
                                <Table.Tr key={idx}>
                                    <Table.Td w={50}>
                                        <Image radius="sm" w={40} fit="contain" src={clip.image_url} />
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={0}>
                                            <Text
                                                fw={800} size="md"
                                            // variant="gradient"
                                            // gradient={{ from: "grape", to: "teal", deg: 45 }}
                                            >
                                                {clip.title}
                                                <Badge size="xs"
                                                    variant="gradient"
                                                    gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                                    ml={6}
                                                >{clip.model_version}</Badge>
                                            </Text>
                                            <Text size="sm" c="dimmed" lineClamp={1}>{clip.tags}</Text>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: "right" }}>
                                        <Text ff="monospace">
                                            {formatSecondsToTime(clip.duration)}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Flex>

                {/* Bottom Section */}
                <Flex gap="sm" direction="row" pt={10}>

                    <TextInput
                        flex={1}
                        value={saveFolder}
                        readOnly
                        onClick={selectOutputFolder}
                        leftSection={<IconFolderFilled />}
                        style={{
                            pointer: "cursor",
                        }}
                    />
                    <Button
                        variant="filled"
                    // loading={isGettingPlaylist}
                    // onClick={getPlaylist}
                    >
                        Download songs
                    </Button>
                </Flex>
            </AppShell.Main>
        </AppShell>
    )
}

function App2() {
    const [greetMsg, setGreetMsg] = useState("");
    const [name, setName] = useState("");

    async function greet() {
        // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
        setGreetMsg(await invoke("greet", { name }));
    }

    async function download() {

        const response = await fetch("https://cdn1.suno.ai/2023b630-359f-4d44-9529-60c3b472c79a.mp3", {
            method: "GET",
        });
        if (response.status !== 200) {
            throw new Error("Failed to fetch the file.");
        }

        const fileData = new Uint8Array(await response.arrayBuffer())
        await writeFile('test.mp3', fileData, { baseDir: BaseDirectory.Desktop })

        console.log("SAVED")

        sendNotification({
            title: "Song downloaded",
            body: "Song downloaded successfully",
        })

        // const file = await create('test.mp3', { baseDir: BaseDirectory.Desktop })
        // await file.write(response.arrayBuffer)
        // await file.close()
        // console.log(response)


        // const response = await fetch("https://cdn1.suno.ai/2023b630-359f-4d44-9529-60c3b472c79a.mp3", {
        //     method: "GET",
        //     //responseType: "ArrayBuffer", // Use ArrayBuffer for binary files
        // });

        // if (!response.data) {
        //     throw new Error("Failed to fetch the file.");
        // }

        // const savePath = await dialog.save({
        //     title: "Save File As",
        //     defaultPath: "downloaded_file", // Default filename
        // });

        // if (!savePath) {
        //     console.log("Save operation cancelled.");
        //     return;
        // }

        // Step 3: Write the file to the selected location
        // const fileData = new Uint8Array(response.data); // Convert ArrayBuffer to Uint8Array
        // await fs.writeBinaryFile(savePath, fileData);

        //console.log(`File successfully saved to: ${savePath}`);


    }

    return (
        <main className="container">
            <h1>Welcome to Tauri + React</h1>

            <div className="row">
                <a href="https://vitejs.dev" target="_blank">
                    <img src="/vite.svg" className="logo vite" alt="Vite logo" />
                </a>
                <a href="https://tauri.app" target="_blank">
                    <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
                </a>
                <a href="https://reactjs.org" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <p>Click on the Tauri, Vite, and React logos to learn more.</p>

            <form
                className="row"
                onSubmit={(e) => {
                    e.preventDefault();
                    greet();
                }}
            >
                <input
                    id="greet-input"
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="Enter a name..."
                />
                <button type="submit">Greet</button>

                <button onClick={download}>DOWNLOAD</button>
            </form>
            <p>{greetMsg}</p>
        </main>
    );
}

export default App;
