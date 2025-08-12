export interface INote {
    user?: string;
    content: string;
    content_data?: any;
}

export interface ITodo {
    user?: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    is_completed: boolean;
    content_data?: any;
    completed_at?: string;
}

export type QueryFilter = {
    user_id?: string, 
    from_page: number, 
    to_page: number,
    lt_date?: string;
    gt_date?: string;
}