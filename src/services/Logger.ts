import { Settings } from "./SettingsManager"
import { app } from '@tauri-apps/api'

export interface IData {
    playlistUrl: string
    noSongs: number
}

const API_URL = 'https://gaozpdxgljx1zmw413194.cleavr.xyz/log';


class Logger {

    static async log(data: IData): Promise<boolean> {

        const bodyData: { [key: string]: any } = {
            playlistUrl: data.playlistUrl,
            noSongs: data.noSongs,
            version: await app.getVersion()
        }

        const userId = await this.getUserId()
        if (userId) {
            bodyData.userId = userId
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json", // Indicate that we're sending JSON
                },
                body: JSON.stringify(bodyData)
            })

            if (response.ok) {
                const json = await response.json()
                this.setUserId(json.userId)
            }
            return true

        } catch (error) {
            //Do nothing. It's not important if the logger fails
            return false
        }

    }

    static async getUserId(): Promise<string | null> {
        return Settings.getSetting('userId', null)
    }

    private static async setUserId(userId: string): Promise<void> {
        await Settings.setSetting('userId', userId)
    }

}



export default Logger