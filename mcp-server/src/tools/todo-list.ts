import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { todoStorage } from '../storage/todo-storage.js';
import { TodoListFilters, TodoListResponse } from '../types/todo.js';

export const todoListTool: Tool = {
  name: 'todo_list',
  description: 'Get list of TODOs with filtering capabilities',
  inputSchema: {
    type: 'object',
    properties: {
      completed: {
        type: 'boolean',
        description: 'Filter by completion status',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Filter by priority level',
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Filter by tags',
      },
      search: {
        type: 'string',
        description: 'Search in title and description',
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

