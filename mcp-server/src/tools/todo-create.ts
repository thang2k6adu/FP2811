import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { todoStorage } from '../storage/todo-storage.js';
import { TodoCreateInput, ApiResponse, Todo } from '../types/todo.js';

export const todoCreateTool: Tool = {
  name: 'todo_create',
  description: 'Create a new TODO item',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Tiêu đề của TODO',
        minLength: 1,
        maxLength: 200,
      },
      description: {
        type: 'string',
        description: 'Mô tả chi tiết của TODO',
        maxLength: 1000,
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Độ ưu tiên của TODO',
        default: 'medium',
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Danh sách tags',
        maxItems: 10,
      },
    },
    required: ['title'],
  },
};

export async function handleTodoCreate(args: unknown): Promise<CallToolResult> {
  try {
    const input = args as TodoCreateInput;

    // Validation
    if (!input.title || input.title.trim().length === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Title is required and cannot be empty',
            },
          }),
        }],
        isError: true,
      };
    }

    if (input.title.length > 200) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Title cannot exceed 200 characters',
            },
          }),
        }],
        isError: true,
      };
    }

    if (input.description && input.description.length > 1000) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Description cannot exceed 1000 characters',
            },
          }),
        }],
        isError: true,
      };
    }

    if (input.tags && input.tags.length > 10) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Cannot have more than 10 tags',
            },
          }),
        }],
        isError: true,
      };
    }

    // Create TODO
    const todo = todoStorage.create({
      title: input.title.trim(),
      description: input.description?.trim(),
      priority: input.priority || 'medium',
      tags: input.tags || [],
      completed: false,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: todo,
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

