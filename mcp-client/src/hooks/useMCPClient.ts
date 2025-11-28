import { useState, useEffect } from 'react';
import { MCPTodoClient } from '../lib/mcp-client.js';

export function useMCPClient() {
  const [client, setClient] = useState<MCPTodoClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mcpClient = new MCPTodoClient();
    setClient(mcpClient);

    mcpClient.connect()
      .then(() => {
        setConnected(true);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to connect to MCP proxy server. Make sure the proxy server is running on port 3001.');
        setConnected(false);
      });

    return () => {
      mcpClient.disconnect().catch(console.error);
    };
  }, []);

  return { client, connected, error };
}

