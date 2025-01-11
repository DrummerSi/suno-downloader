import { invoke } from "@tauri-apps/api/core"

export async function addImageToMp3(mp3Path: string, imagePath: string): Promise<string> {
    try {
        const result = await invoke<string>("add_image_to_mp3", { mp3Path, imagePath });
        return result; // "Successfully added image to MP3 at ..."
    } catch (error) {
        console.error("Error adding image to MP3:", error);
        throw new Error(error as string);
    }
}

export async function deletePath(targetPath: string) {
    try {
        const result = await invoke<string>("delete_path", { targetPath });
        console.log(result); // "Directories ensured for path: ..."
    } catch (error) {
        console.error("Failed to delete path:", error);
    }
}

export async function ensureDir(dirPath: string) {
    try {
        const result = await invoke<string>("ensure_directory_exists", { dirPath });
        console.log(result); // "Directories ensured for path: ..."
    } catch (error) {
        console.error("Failed to create directories:", error);
    }
}

export async function writeFile(name: string, content: ArrayBuffer) {
    const uint8ArrayContent = new Uint8Array(content);
    try {
        const result = await invoke("write_file", { name, content: uint8ArrayContent });
        console.log(result); // On success, log the success message
    } catch (error) {
        console.error('Error:', error); // On failure, log the error message
    }
}