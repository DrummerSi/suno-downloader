import { Store, load } from '@tauri-apps/plugin-store'

import { app } from '@tauri-apps/api'

export interface IData {
    playlistUrl: string
    noSongs: number
}

const API_URL = 'https://gaozpdxgljx1zmw413194.cleavr.xyz/log';


class Logger {

    private static store: Store

    private static async init() {
        if (!this.store) {
            this.store = await load('store.json', { autoSave: false });
        }
    }

    static async log(data: IData): Promise<boolean> {

        if (!this.store) await this.init()

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
        if (await this.store.has('userId')) {
            return await this.store.get('userId')
        } else {
            return null
        }
    }

    private static async setUserId(userId: string): Promise<void> {
        await this.store.set('userId', userId)
    }

}


export default Logger