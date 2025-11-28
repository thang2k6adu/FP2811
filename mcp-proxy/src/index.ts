import express from 'express';
import cors from 'cors';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_PATH = join(__dirname, '../../mcp-server/dist/index.js');

const app = express();
app.use(cors());
app.use(express.json());

// Store client instances (one per request session)
const clients = new Map<string, Client>();

// Create MCP client for a session
async function getClient(sessionId: string): Promise<Client> {
  if (clients.has(sessionId)) {
    return clients.get(sessionId)!;
  }

  const transport = new StdioClientTransport({
    command: 'node',
    args: [SERVER_PATH],
  });

  const client = new Client(
    {
      name: 'mcp-todo-proxy-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  clients.set(sessionId, client);
  return client;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Call MCP tool
app.post('/api/tools/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const args = req.body;

    const client = await getClient(sessionId);
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    res.json(result);
  } catch (error) {
    console.error('Error calling tool:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// List available tools
app.get('/api/tools', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const client = await getClient(sessionId);
    
    // Get tools list
    const tools = await client.listTools();
    res.json(tools);
  } catch (error) {
    console.error('Error listing tools:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// List available resources
app.get('/api/resources', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const client = await getClient(sessionId);
    
    // Get resources list
    const resources = await client.listResources();
    res.json(resources);
  } catch (error) {
    console.error('Error listing resources:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Read a resource
app.get('/api/resources/:uri', async (req, res) => {
  try {
    const { uri } = req.params;
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const client = await getClient(sessionId);
    
    // Decode URI
    const decodedUri = decodeURIComponent(uri);
    
    // Read resource
    const resource = await client.readResource({
      uri: decodedUri,
    });
    res.json(resource);
  } catch (error) {
    console.error('Error reading resource:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP Proxy Server running on http://localhost:${PORT}`);
});

