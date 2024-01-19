export interface Review {
    id: number,
    summary: string,
    review: string,
    date_added: string,
    user_score: number,
    user_id: number,
    nickname: string
    own_review: boolean
}

export interface CreateReview {
    data: {
        summary: string,
        review: string,
        library: number,
    }

}
