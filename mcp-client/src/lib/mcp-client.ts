import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Todo, TodoCreateInput, TodoUpdateInput, TodoListFilters, ApiResponse, TodoListResponse } from '../types/todo.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class MCPTodoClient {
  private sessionId: string;
  private connected: boolean = false;

  constructor() {
    // Generate a session ID for this client instance
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async connect(): Promise<void> {
    try {
      // Test connection
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error('Proxy server not available');
      }
      this.connected = true;
    } catch (error) {
      throw new Error(`Failed to connect to proxy server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  private async callTool(name: string, args: unknown): Promise<CallToolResult> {
    if (!this.connected) {
      throw new Error('Client not connected');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tools/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId,
        },
        body: JSON.stringify(args),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Tool call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseResponse<T>(result: CallToolResult): ApiResponse<T> {
    if (result.isError) {
      return {
        success: false,
        error: {
          code: 'TOOL_ERROR',
          message: 'Tool execution failed',
        },
      };
    }

    const textContent = result.content?.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid response format',
        },
      };
    }

    try {
      return JSON.parse(textContent.text) as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to parse response',
        },
      };
    }
  }

  async createTodo(input: TodoCreateInput): Promise<ApiResponse<Todo>> {
    const result = await this.callTool('todo_create', input);
    return this.parseResponse<Todo>(result);
  }

  async listTodos(filters?: TodoListFilters): Promise<ApiResponse<TodoListResponse>> {
    const result = await this.callTool('todo_list', filters || {});
    return this.parseResponse<TodoListResponse>(result);
  }

  async updateTodo(input: TodoUpdateInput): Promise<ApiResponse<Todo>> {
    const result = await this.callTool('todo_update', input);
    return this.parseResponse<Todo>(result);
  }

  async deleteTodo(id: string): Promise<ApiResponse<{ id: string; deleted: boolean; deletedAt: string }>> {
    const result = await this.callTool('todo_delete', { id });
    return this.parseResponse<{ id: string; deleted: boolean; deletedAt: string }>(result);
  }
}

