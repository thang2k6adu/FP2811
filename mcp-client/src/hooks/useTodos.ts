import { useState, useEffect, useCallback } from 'react';
import { MCPTodoClient } from '../lib/mcp-client.js';
import { Todo, TodoCreateInput, TodoUpdateInput, TodoListFilters } from '../types/todo.js';

export function useTodos(client: MCPTodoClient | null) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TodoListFilters>({});

  const loadTodos = useCallback(async (newFilters?: TodoListFilters) => {
    if (!client) return;

    setLoading(true);
    setError(null);
    try {
      const response = await client.listTodos(newFilters || filters);
      if (response.success && response.data) {
        setTodos(response.data.todos);
      } else {
        setError(response.error?.message || 'Failed to load todos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [client, filters]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const createTodo = useCallback(async (input: TodoCreateInput) => {
    if (!client) return false;

    setLoading(true);
    setError(null);
    try {
      const response = await client.createTodo(input);
      if (response.success) {
        await loadTodos();
        return true;
      } else {
        setError(response.error?.message || 'Failed to create todo');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, loadTodos]);

  const updateTodo = useCallback(async (input: TodoUpdateInput) => {
    if (!client) return false;

    setLoading(true);
    setError(null);
    try {
      const response = await client.updateTodo(input);
      if (response.success) {
        await loadTodos();
        return true;
      } else {
        setError(response.error?.message || 'Failed to update todo');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, loadTodos]);

  const deleteTodo = useCallback(async (id: string) => {
    if (!client) return false;

    setLoading(true);
    setError(null);
    try {
      const response = await client.deleteTodo(id);
      if (response.success) {
        await loadTodos();
        return true;
      } else {
        setError(response.error?.message || 'Failed to delete todo');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, loadTodos]);

  const applyFilters = useCallback((newFilters: TodoListFilters) => {
    setFilters(newFilters);
    loadTodos(newFilters);
  }, [loadTodos]);

  return {
    todos,
    loading,
    error,
    filters,
    createTodo,
    updateTodo,
    deleteTodo,
    applyFilters,
    refresh: loadTodos,
  };
}

