import { PaginatedData } from "./data";

export interface User {
    id?: number;
    name: string;
    nickname: string;
    email: string;
    uuid?:string;

}
export type PaginatedUsers = PaginatedData<User>;