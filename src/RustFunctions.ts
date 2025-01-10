import { invoke } from "@tauri-apps/api/core"

export async function writeFile(name: string, content: any) {
    return await invoke("write_file", { name, content });
}