export enum IPlaylistClipStatus {
    None,
    Processing,
    Success,
    Error
}

export interface IPlaylist {
    name: string
    image: string
    //clips: IPlaylistClip[] | undefined
}

export interface IPlaylistClip {
    id: string
    no: number
    title: string
    duration: number
    tags: string
    model_version: string
    audio_url: string
    video_url: string
    image_url: string
    image_large_url: string
    status: IPlaylistClipStatus
}

class Suno {

    static async getSongsFromPlayList(url: string): Promise<[IPlaylist, IPlaylistClip[]]> {

        //TODO: Check we're in format: https://suno.com/playlist/8ebe794f-d640-46b6-bde8-121622e1a4c2 (https://suno.com/playlist/liked not supported)
        //Scrape URL: https://studio-api.prod.suno.com/api/playlist/8ebe794f-d640-46b6-bde8-121622e1a4c2/?page=1

        // ─── Extract Playlist Id ─────────────────────────────────────
        const regex = /suno\.com\/playlist\/(.*)/
        const match = url.match(regex)
        let playlistId = ""

        if (match && match[1]) {
            playlistId = match[1]
        } else {
            throw new Error("Invalid URL or no playlist ID found")
        }

        // ─── Fetch Playlist Data ─────────────────────────────────────
        let currentPage = 1
        let songNo = 1
        let endOfPlaylist = false

        let playlistName = ""
        let playListImage = ""
        const clips: IPlaylistClip[] = []

        while (!endOfPlaylist) {
            const response = await fetch(`https://studio-api.prod.suno.com/api/playlist/${playlistId}/?page=${currentPage}`)

            if (response.status !== 200) {
                throw new Error("Failed to fetch playlist data")
            }

            const data = await response.json()
            if (data.playlist_clips.length == 0) {
                endOfPlaylist = true
            } else {
                playlistName = data.name
                playListImage = data.image_url

                data.playlist_clips.forEach(({ clip }: any) => {
                    const itemData: IPlaylistClip = {
                        id: clip.id,
                        no: songNo,
                        title: clip.title,
                        duration: clip.metadata.duration,
                        tags: clip.metadata.tags,
                        model_version: clip.major_model_version,
                        audio_url: clip.audio_url,
                        video_url: clip.video_url,
                        image_url: clip.image_url,
                        image_large_url: clip.image_large_url,
                        status: IPlaylistClipStatus.None
                    }
                    clips.push(itemData)
                    songNo++
                })
            }
            currentPage++
        }

        return [
            {
                name: playlistName,
                image: playListImage
            },
            clips
        ]
    }



}


export default Suno