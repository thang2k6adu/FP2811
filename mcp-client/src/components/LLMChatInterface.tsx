import { useState, useRef, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { MCPTodoClient } from '../lib/mcp-client.js';
import { TodoCreateInput, TodoUpdateInput } from '../types/todo.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LLMChatInterfaceProps {
  mcpClient: MCPTodoClient | null;
  onTodoCreated?: () => void;
  onTodoUpdated?: () => void;
  onTodoDeleted?: () => void;
}

export function LLMChatInterface({ mcpClient, onTodoCreated, onTodoUpdated, onTodoDeleted }: LLMChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you manage your TODOs. Try saying "Create a todo to buy milk" or "Show me all incomplete todos".',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !mcpClient) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Check if API key is available
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Error: VITE_ANTHROPIC_API_KEY is not set. Please set it in your .env file.',
          },
        ]);
        return;
      }

      const anthropic = new Anthropic({ apiKey });

      // Get available tools from MCP client
      const tools = [
        {
          name: 'todo_create',
          description: 'Create a new TODO item',
          input_schema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Title of the TODO' },
              description: { type: 'string', description: 'Description of the TODO' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the TODO' },
            },
            required: ['title'],
          },
        },
        {
          name: 'todo_list',
          description: 'List all TODOs with optional filters',
          input_schema: {
            type: 'object',
            properties: {
              completed: { type: 'boolean', description: 'Filter by completion status' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Filter by priority' },
              search: { type: 'string', description: 'Search in title and description' },
            },
          },
        },
        {
          name: 'todo_update',
          description: 'Update an existing TODO',
          input_schema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'ID of the TODO to update' },
              title: { type: 'string', description: 'New title' },
              description: { type: 'string', description: 'New description' },
              completed: { type: 'boolean', description: 'Completion status' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
            },
            required: ['id'],
          },
        },
        {
          name: 'todo_delete',
          description: 'Delete a TODO',
          input_schema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'ID of the TODO to delete' },
            },
            required: ['id'],
          },
        },
      ];

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        tools,
        messages: [
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: 'user', content: userMessage },
        ],
      });

      let assistantMessage = '';
      let toolResults: any[] = [];

      // Handle tool use
      for (const content of response.content) {
        if (content.type === 'text') {
          assistantMessage += content.text;
        } else if (content.type === 'tool_use') {
          let toolResult;
          try {
            switch (content.name) {
              case 'todo_create':
                toolResult = await mcpClient.createTodo(content.input as TodoCreateInput);
                if (toolResult.success) {
                  onTodoCreated?.();
                }
                break;
              case 'todo_list':
                toolResult = await mcpClient.listTodos(content.input);
                break;
              case 'todo_update':
                toolResult = await mcpClient.updateTodo(content.input as TodoUpdateInput);
                if (toolResult.success) {
                  onTodoUpdated?.();
                }
                break;
              case 'todo_delete':
                toolResult = await mcpClient.deleteTodo((content.input as any).id);
                if (toolResult.success) {
                  onTodoDeleted?.();
                }
                break;
            }
            toolResults.push({
              tool_use_id: content.id,
              content: JSON.stringify(toolResult),
            });
          } catch (error) {
            toolResults.push({
              tool_use_id: content.id,
              content: JSON.stringify({
                success: false,
                error: { code: 'EXECUTION_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
              }),
            });
          }
        }
      }

      // If there are tool results, get a follow-up response
      if (toolResults.length > 0) {
        const followUpResponse = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          tools,
          messages: [
            ...messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user', content: userMessage },
            {
              role: 'assistant',
              content: response.content,
            },
            {
              role: 'user',
              content: toolResults,
            },
          ],
        });

        for (const content of followUpResponse.content) {
          if (content.type === 'text') {
            assistantMessage += content.text;
          }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage || 'Done!' }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>LLM Chat Interface</h2>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong> {msg.content}
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <strong>Assistant:</strong> Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={loading || !mcpClient}
          />
          <button onClick={handleSend} className="btn-primary" disabled={loading || !mcpClient || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

