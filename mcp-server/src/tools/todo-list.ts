import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { todoStorage } from '../storage/todo-storage.js';
import { TodoListFilters, TodoListResponse } from '../types/todo.js';

export const todoListTool: Tool = {
  name: 'todo_list',
  description: 'Lấy danh sách TODOs với khả năng filter',
  inputSchema: {
    type: 'object',
    properties: {
      completed: {
        type: 'boolean',
        description: 'Filter theo trạng thái hoàn thành',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Filter theo độ ưu tiên',
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Filter theo tags',
      },
      search: {
        type: 'string',
        description: 'Tìm kiếm trong title và description',
      },
      sortBy: {
        type: 'string',
        enum: ['createdAt', 'updatedAt', 'priority', 'title'],
        default: 'createdAt',
        description: 'Sort by field',
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
        description: 'Sort order',
      },
    },
  },
};

export async function handleTodoList(args: unknown): Promise<CallToolResult> {
  try {
    const filters = args as TodoListFilters;
    const result = todoStorage.findAll(filters);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: result,
        }),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        }),
      }],
      isError: true,
    };
  }
}

