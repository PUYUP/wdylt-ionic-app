export interface INote {
    user?: string;
    content: string;
    content_data?: any;
}

export interface ITodo {
    description: string;
}

export type QueryFilter = {
    user_id?: string, 
    from_page: number, 
    to_page: number,
    lt_date?: string;
    gt_date?: string;
}