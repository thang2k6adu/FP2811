import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  todoCreateTool,
  handleTodoCreate,
  todoListTool,
  handleTodoList,
  todoUpdateTool,
  handleTodoUpdate,
  todoDeleteTool,
  handleTodoDelete,
} from './tools/index.js';
import { createTodoUIResource } from './resources/todo-ui.js';

export async function createMCPServer(): Promise<Server> {
  const server = new Server(
    {
      name: 'mcp-todo-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Register tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      todoCreateTool,
      todoListTool,
      todoUpdateTool,
      todoDeleteTool,
    ],
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'todo_create':
        return await handleTodoCreate(args);
      case 'todo_list':
        return await handleTodoList(args);
      case 'todo_update':
        return await handleTodoUpdate(args);
      case 'todo_delete':
        return await handleTodoDelete(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: 'ui://todo/interface',
        name: 'TODO Interface',
        description: 'Interactive TODO management interface',
        mimeType: 'text/html+skybridge',
      },
    ],
  }));

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'ui://todo/interface') {
      const uiResource = createTodoUIResource();

      return {
        contents: [
          {
            uri: 'ui://todo/interface',
            mimeType: 'text/html+skybridge',
            text: JSON.stringify(uiResource),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  return server;
}

export async function startServer(): Promise<void> {
  const server = await createMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Todo Server running on stdio');
}

