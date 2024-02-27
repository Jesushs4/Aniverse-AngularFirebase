export interface Review {
    id: string,
    summary: string,
    review: string,
    date_added: string,
    user_score: number,
    user_id: string,
    nickname: string
    own_review: boolean,
    animeId?: string,
    userId?: string
}

export interface CreateReview {
    data: {
        summary: string,
        review: string,
        library: number,
    }

}
