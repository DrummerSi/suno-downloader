import "./App.css";

import * as path from "@tauri-apps/api/path";

import {
    AppShell,
} from "@mantine/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Logger from "./services/Logger";
import Suno, { IPlaylist, IPlaylistClip, IPlaylistClipStatus } from "./services/Suno";
import { addImageToMp3, deletePath, ensureDir, existsFile, writeFile } from "./services/RustFunctions";
import { fetch } from "@tauri-apps/plugin-http";
import filenamify from "filenamify";
import { getSettingsManager, Settings } from "./services/SettingsManager";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

import pLimit from "p-limit";
import scrollIntoView from "scroll-into-view-if-needed";
import { showError, showSuccess } from "./services/Utils";

import DebugPanel from "./components/DebugPanel";
import AppHeader from "./components/AppHeader";
import DownloadControls from "./components/DownloadControls";
import SongTableSection from "./components/SongTableSection";
import PlaylistUrlSection from "./components/PlaylistUrlSection";
import { MAX_PARALLEL_DOWNLOADS } from "./consts";
import AppFooter from "./components/AppFooter";
import { downloadClip, DownloadContext, DownloadProgress } from "./services/downloads";




function App() {
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [saveFolder, setSaveFolder] = useState("");
    const [isGettingPlaylist, setIsGettingPlaylist] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({ completed: 0, total: 0 });
    const [playlistData, setPlaylistData] = useState<IPlaylist | null>(null);
    const [playlistClips, setPlaylistClips] = useState<IPlaylistClip[]>([]);
    const [footerView, setFooterView] = useState<1 | 2>(1);

    const songTable = useRef<HTMLTableElement>(null);

    const downloadPercentage = useMemo(() => {
        if (downloadProgress.total === 0) return 0;

        return Math.min(100, Math.ceil((downloadProgress.completed / downloadProgress.total) * 100));
    }, [downloadProgress]);

    const resetDownloadProgress = useCallback((total: number) => {
        setDownloadProgress({ completed: 0, total });
    }, []);

    const markDownloadComplete = useCallback(() => {
        setDownloadProgress((progress) => ({
            ...progress,
            completed: Math.min(progress.completed + 1, progress.total),
        }));
    }, []);

    const prepareDownloadContext = useCallback(
        async (playlistName: string): Promise<DownloadContext> => {
            const settings = await (await getSettingsManager()).loadAll();
            const outputDir = await path.join(saveFolder, filenamify(playlistName));
            const tmpDir = await path.join(outputDir, "tmp");

            await ensureDir(outputDir);
            await ensureDir(tmpDir);

            return { settings, outputDir, tmpDir };
        },
        [saveFolder]
    );

    const updateClipStatus = useCallback((id: string, status: IPlaylistClipStatus) => {
        setPlaylistClips((prevClips) =>
            prevClips.map((clip) => (clip.id === id ? { ...clip, status } : clip))
        );
    }, []);

    const scrollToRow = useCallback((row: string) => {
        const node = songTable.current?.querySelector(`tr[data-id="row-${row}"]`);
        if (!node) return;

        scrollIntoView(node, {
            scrollMode: "if-needed",
            behavior: "smooth",
            block: "end",
        });
    }, []);

    const getPlaylist = async () => {
        setIsGettingPlaylist(true);
        setPlaylistData(null);
        setPlaylistClips([]);
        resetDownloadProgress(0);

        try {
            const data = await Suno.getSongsFromPlayList(playlistUrl);

            setPlaylistData(data[0]);
            setPlaylistClips(data[1]);

            await Logger.log({
                playlistUrl,
                noSongs: data[1].length,
            });
        } catch (err) {
            console.log(err);
            showError("Failed to fetch playlist data. Make sure you entered a valid link");
        } finally {
            setIsGettingPlaylist(false);
        }
    };

    const selectOutputFolder = async () => {
        const dir = await openDialog({
            title: "Select Output Folder",
            directory: true,
            canCreateDirectories: true,
        });

        if (dir) setSaveFolder(dir);
    };

    const downloadPlaylist = async () => {
        if (!playlistData || playlistClips.length === 0) return;

        let context: DownloadContext | null = null;

        resetDownloadProgress(playlistClips.length);
        setIsDownloading(true);

        try {
            context = await prepareDownloadContext(playlistData.name);
            const downloadContext = context;
            const limit = pLimit(MAX_PARALLEL_DOWNLOADS);

            setPlaylistClips((prevClips) =>
                prevClips.map((clip) => ({ ...clip, status: IPlaylistClipStatus.None }))
            );

            await Promise.all(
                playlistClips.map((song) =>
                    limit(async () => {
                        await downloadClip(song, {
                            context: downloadContext,
                            scrollToRow,
                            updateClipStatus,
                        });
                        markDownloadComplete();
                    })
                )
            );

            showSuccess("Playlist downloaded successfully");
        } catch (err) {
            console.log(err);
            showError("Failed to download playlist");
        } finally {
            setIsDownloading(false);
            if (context) await deletePath(context.tmpDir);
        }
    };

    const downloadSingleSong = async (song: IPlaylistClip) => {
        if (!playlistData) return;

        let context: DownloadContext | null = null;

        resetDownloadProgress(1);
        setIsDownloading(true);

        try {
            context = await prepareDownloadContext(playlistData.name);
            const result = await downloadClip(song, {
                context,
                forceOverwrite: true,
                scrollToRow,
                updateClipStatus,
            });

            markDownloadComplete();

            if (result === "error") {
                showError("Failed to download song");
                return;
            }

            showSuccess(result === "skipped" ? "Song already exists" : "Song downloaded successfully");
        } catch (err) {
            console.log(err);
            showError("Failed to download song");
        } finally {
            setIsDownloading(false);
            if (context) await deletePath(context.tmpDir);
        }
    };

    const deleteClip = (clipToRemove: IPlaylistClip) => {
        setPlaylistClips((prev) => prev.filter((clip) => clip.id !== clipToRemove.id));
    };

    useEffect(() => {
        const initSavePath = async () => {
            const defaultSavePath = await path.audioDir();
            setSaveFolder(defaultSavePath);
        };

        initSavePath();
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(
            () => setFooterView(isDownloading ? 2 : 1),
            isDownloading ? 0 : 500
        );

        return () => window.clearTimeout(timeout);
    }, [isDownloading]);

    return (
        <AppShell header={{ height: 50 }} padding="lg">
            <AppHeader />

            <AppShell.Main
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh",
                    overflow: "hidden",
                }}
            >
                <PlaylistUrlSection
                    playlistUrl={playlistUrl}
                    isGettingPlaylist={isGettingPlaylist}
                    isDownloading={isDownloading}
                    onPlaylistUrlChange={setPlaylistUrl}
                    onGetPlaylist={getPlaylist}
                />

                <SongTableSection
                    clips={playlistClips}
                    hasPlaylist={Boolean(playlistData)}
                    isDownloading={isDownloading}
                    tableRef={songTable}
                    onDeleteClip={deleteClip}
                    onDownloadClip={downloadSingleSong}
                />

                <DownloadControls
                    hasPlaylist={Boolean(playlistData)}
                    isGettingPlaylist={isGettingPlaylist}
                    isDownloading={isDownloading}
                    saveFolder={saveFolder}
                    onDownloadPlaylist={downloadPlaylist}
                    onSelectOutputFolder={selectOutputFolder}
                />

                <DebugPanel footerView={footerView} onToggleFooterView={setFooterView} />

                <AppFooter downloadPercentage={downloadPercentage} footerView={footerView} />
            </AppShell.Main>
        </AppShell>
    );
}











export default App;
