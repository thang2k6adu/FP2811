import { Todo, TodoListFilters, TodoListResponse } from '../types/todo.js';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage
class TodoStorage {
  private todos: Map<string, Todo> = new Map();

  create(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Todo {
    const now = new Date().toISOString();
    const newTodo: Todo = {
      ...todo,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.todos.set(newTodo.id, newTodo);
    return newTodo;
  }

  findById(id: string): Todo | undefined {
    return this.todos.get(id);
  }

  findAll(filters?: TodoListFilters): TodoListResponse {
    let todos = Array.from(this.todos.values());

    // Apply filters
    if (filters) {
      if (filters.completed !== undefined) {
        todos = todos.filter(t => t.completed === filters.completed);
      }

      if (filters.priority) {
        todos = todos.filter(t => t.priority === filters.priority);
      }

      if (filters.tags && filters.tags.length > 0) {
        todos = todos.filter(t => 
          t.tags && t.tags.some(tag => filters.tags!.includes(tag))
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        todos = todos.filter(t => 
          t.title.toLowerCase().includes(searchLower) ||
          (t.description && t.description.toLowerCase().includes(searchLower))
        );
      }

      // Sort
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      
      todos.sort((a, b) => {
        let aVal: any = a[sortBy];
        let bVal: any = b[sortBy];

        // Handle priority sorting
        if (sortBy === 'priority') {
          const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
          aVal = aVal && typeof aVal === 'string' ? (priorityOrder[aVal] || 0) : 0;
          bVal = bVal && typeof bVal === 'string' ? (priorityOrder[bVal] || 0) : 0;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return {
      todos,
      total: todos.length,
      filters,
    };
  }

  update(id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Todo | null {
    const todo = this.todos.get(id);
    if (!todo) {
      return null;
    }

    const updatedTodo: Todo = {
      ...todo,
      ...updates,
      id: todo.id,
      createdAt: todo.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.todos.set(id, updatedTodo);
    return updatedTodo;
  }

  delete(id: string): boolean {
    return this.todos.delete(id);
  }

  clear(): void {
    this.todos.clear();
  }
}

// Singleton instance
export const todoStorage = new TodoStorage();

