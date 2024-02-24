export interface Anime {
    id: string,
    title: string,
    title_english: string,
    episodes: number,
    status: string,
    synopsis?: string,
    year: number,
    images: {
        jpg: {
            image_url: string
        }
    }
    genres: any[],
    favorites?: number,
    mal_id: number,
    episodes_watched: number,
    watch_status: string,
    user_score: number
}


export interface Library {
    id: number,
    attributes: {
        anime: {
            data: [{
                attributes: {
                    title: string,
                    title_english: string,
                    episodes: number,
                    status: string,
                    synopsis: string,
                    year: number,
                    image_url: string,
                    genres: any[],
                    favorites: number,
                    mal_id: number,
                }

            }]

        }
        episodes_watched: number,
        watch_status: string,
        user_score: number
    }
}