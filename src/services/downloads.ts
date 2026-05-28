import { path } from "@tauri-apps/api";
import { IPlaylistClip, IPlaylistClipStatus } from "./Suno";
import filenamify from "filenamify";
import { addImageToMp3, existsFile, writeFile } from "./RustFunctions";
import { Settings } from "./SettingsManager";
import { fetch } from "@tauri-apps/plugin-http";

export type DownloadContext = {
    settings: Settings;
    outputDir: string;
    tmpDir: string;
};

type DownloadResult = "success" | "skipped" | "error";

export type DownloadProgress = {
    completed: number;
    total: number;
};

type DownloadClipOptions = {
    context: DownloadContext;
    forceOverwrite?: boolean;
    scrollToRow: (id: string) => void;
    updateClipStatus: (id: string, status: IPlaylistClipStatus) => void;
};


export const getSongName = async (song: IPlaylistClip, template: string, outputDir: string) => {
    const songNumber = song.no.toString().padStart(2, "0");
    const songTitle = filenamify(song.title);
    const songName = template.replace("{trackno}", songNumber).replace("{name}", songTitle);

    return await path.join(outputDir, `${songName}.mp3`);
};

export const embedClipImage = async (song: IPlaylistClip, songFileName: string, tmpDir: string) => {
    const response = await fetch(song.image_url);
    if (response.status !== 200) return;

    const imageBuffer = await response.arrayBuffer();
    const imageFileName = await path.join(tmpDir, `${filenamify(song.id)}.jpg`);

    await writeFile(imageFileName, imageBuffer);
    await addImageToMp3(songFileName, imageFileName);
};

export const downloadClip = async (song: IPlaylistClip, options: DownloadClipOptions): Promise<DownloadResult> => {
    const { context, forceOverwrite = false, scrollToRow, updateClipStatus } = options;
    const { settings, outputDir, tmpDir } = context;

    updateClipStatus(song.id, IPlaylistClipStatus.Processing);
    scrollToRow(song.id);

    const songFileName = await getSongName(song, settings.name_templates, outputDir);
    const shouldSkipExistingFile =
        !forceOverwrite &&
        settings.overwrite_files === "false" &&
        Boolean(await existsFile(songFileName));

    if (shouldSkipExistingFile) {
        updateClipStatus(song.id, IPlaylistClipStatus.Skipped);
        return "skipped";
    }

    const response = await fetch(song.audio_url);

    if (response.status !== 200) {
        updateClipStatus(song.id, IPlaylistClipStatus.Error);
        return "error";
    }

    const songBuffer = await response.arrayBuffer();
    await writeFile(songFileName, songBuffer);

    if (settings.embed_images === "true") {
        await embedClipImage(song, songFileName, tmpDir);
    }

    updateClipStatus(song.id, IPlaylistClipStatus.Success);
    return "success";
};