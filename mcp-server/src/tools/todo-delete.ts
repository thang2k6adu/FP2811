import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { todoStorage } from '../storage/todo-storage.js';

export const todoDeleteTool: Tool = {
  name: 'todo_delete',
  description: 'Delete a TODO',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the TODO to delete',
        pattern: '^[a-f0-9-]{36}$',
      },
    },
    required: ['id'],
  },
};

export async function handleTodoDelete(args: unknown): Promise<CallToolResult> {
  try {
    const input = args as { id: string };

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

    // Delete TODO
    const deleted = todoStorage.delete(input.id);
    if (!deleted) {
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
          data: {
            id: input.id,
            deleted: true,
            deletedAt: new Date().toISOString(),
          },
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

