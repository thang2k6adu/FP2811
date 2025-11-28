export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  priority?: Priority;
  tags?: string[];
}

export interface TodoCreateInput {
  title: string;
  description?: string;
  priority?: Priority;
  tags?: string[];
}

export interface TodoUpdateInput {
  id: string;
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
  tags?: string[];
}

export interface TodoListFilters {
  completed?: boolean;
  priority?: Priority;
  tags?: string[];
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface TodoListResponse {
  todos: Todo[];
  total: number;
  filters?: TodoListFilters;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}


