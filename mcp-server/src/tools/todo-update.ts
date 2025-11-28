import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { todoStorage } from '../storage/todo-storage.js';
import { TodoUpdateInput, Todo } from '../types/todo.js';

export const todoUpdateTool: Tool = {
  name: 'todo_update',
  description: 'Cập nhật thông tin của một TODO',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID của TODO cần update',
        pattern: '^[a-f0-9-]{36}$',
      },
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Tiêu đề mới của TODO',
      },
      description: {
        type: 'string',
        maxLength: 1000,
        description: 'Mô tả mới của TODO',
      },
      completed: {
        type: 'boolean',
        description: 'Trạng thái hoàn thành',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Độ ưu tiên mới',
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Danh sách tags mới',
        maxItems: 10,
      },
    },
    required: ['id'],
  },
};

export async function handleTodoUpdate(args: unknown): Promise<CallToolResult> {
  try {
    const input = args as TodoUpdateInput;

    // Validation
    if (!input.id || !/^[a-f0-9-]{36}$/.test(input.id)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid TODO ID format',
            },
          }),
        }],
        isError: true,
      };
    }

    // Check if TODO exists
    const existingTodo = todoStorage.findById(input.id);
    if (!existingTodo) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `TODO with id '${input.id}' not found`,
            },
          }),
        }],
        isError: true,
      };
    }

    // Validate title if provided
    if (input.title !== undefined) {
      if (!input.title || input.title.trim().length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Title cannot be empty',
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
    }

    if (input.description !== undefined && input.description.length > 1000) {
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

    // Prepare updates
    const updates: Partial<Todo> = {};
    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.description !== undefined) updates.description = input.description.trim();
    if (input.completed !== undefined) updates.completed = input.completed;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.tags !== undefined) updates.tags = input.tags;

    // Update TODO
    const updatedTodo = todoStorage.update(input.id, updates);
    if (!updatedTodo) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `TODO with id '${input.id}' not found`,
            },
          }),
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: updatedTodo,
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

