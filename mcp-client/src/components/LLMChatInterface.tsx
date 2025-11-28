import { useState, useRef, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { MCPTodoClient } from '../lib/mcp-client.js';
import { TodoCreateInput, TodoUpdateInput, TodoListFilters } from '../types/todo.js';

type LLMProvider = 'claude' | 'openai';

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
      // Determine which provider to use (default to OpenAI for cheaper cost)
      const provider: LLMProvider = (import.meta.env.VITE_LLM_PROVIDER || 'openai') as LLMProvider;
      
      let apiKey: string | undefined;
      if (provider === 'claude') {
        apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
        if (!apiKey) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Error: VITE_ANTHROPIC_API_KEY is not set. Please set it in your .env file, or use OpenAI by setting VITE_LLM_PROVIDER=openai and VITE_OPENAI_API_KEY.',
            },
          ]);
          return;
        }
      } else {
        apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Error: VITE_OPENAI_API_KEY is not set. Please set it in your .env file. Get your key at https://platform.openai.com/api-keys',
            },
          ]);
          return;
        }
      }

      // Get available tools from MCP client
      const tools = [
        {
          name: 'todo_create',
          description: 'Create a new TODO item',
          input_schema: {
            type: 'object' as const,
            properties: {
              title: { type: 'string' as const, description: 'Title of the TODO' },
              description: { type: 'string' as const, description: 'Description of the TODO' },
              priority: { type: 'string' as const, enum: ['low', 'medium', 'high'], description: 'Priority level' },
              tags: { type: 'array' as const, items: { type: 'string' as const }, description: 'Tags for the TODO' },
            },
            required: ['title'],
          },
        },
        {
          name: 'todo_list',
          description: 'List all TODOs with optional filters',
          input_schema: {
            type: 'object' as const,
            properties: {
              completed: { type: 'boolean' as const, description: 'Filter by completion status' },
              priority: { type: 'string' as const, enum: ['low', 'medium', 'high'], description: 'Filter by priority' },
              search: { type: 'string' as const, description: 'Search in title and description' },
            },
          },
        },
        {
          name: 'todo_update',
          description: 'Update an existing TODO',
          input_schema: {
            type: 'object' as const,
            properties: {
              id: { type: 'string' as const, description: 'ID of the TODO to update' },
              title: { type: 'string' as const, description: 'New title' },
              description: { type: 'string' as const, description: 'New description' },
              completed: { type: 'boolean' as const, description: 'Completion status' },
              priority: { type: 'string' as const, enum: ['low', 'medium', 'high'], description: 'Priority level' },
              tags: { type: 'array' as const, items: { type: 'string' as const }, description: 'Tags' },
            },
            required: ['id'],
          },
        },
        {
          name: 'todo_delete',
          description: 'Delete a TODO',
          input_schema: {
            type: 'object' as const,
            properties: {
              id: { type: 'string' as const, description: 'ID of the TODO to delete' },
            },
            required: ['id'],
          },
        },
      ];

      let assistantMessage = '';
      let toolResults: any[] = [];

      if (provider === 'claude') {
        // Use Claude
        const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

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
      } else {
        // Use OpenAI (cheaper option)
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

        // Convert tools to OpenAI format
        const openaiTools = tools.map(tool => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema,
          },
        }));

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          max_tokens: 1024,
          tools: openaiTools,
          messages: [
            ...messages.map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            })),
            { role: 'user', content: userMessage },
          ],
        });

        const message = response.choices[0].message;
        if (message.content) {
          assistantMessage += message.content;
        }

        // Handle function calls
        if (message.tool_calls && message.tool_calls.length > 0) {
          for (const toolCall of message.tool_calls) {
            let toolResult;
            try {
              // OpenAI tool calls have different structure
              const functionCall = 'function' in toolCall ? toolCall.function : null;
              if (!functionCall) continue;
              
              const args = JSON.parse(functionCall.arguments);
              switch (functionCall.name) {
                case 'todo_create':
                  toolResult = await mcpClient.createTodo(args as TodoCreateInput);
                  if (toolResult.success) {
                    onTodoCreated?.();
                  }
                  break;
                case 'todo_list':
                  toolResult = await mcpClient.listTodos(args as TodoListFilters);
                  break;
                case 'todo_update':
                  toolResult = await mcpClient.updateTodo(args as TodoUpdateInput);
                  if (toolResult.success) {
                    onTodoUpdated?.();
                  }
                  break;
                case 'todo_delete':
                  toolResult = await mcpClient.deleteTodo(args.id);
                  if (toolResult.success) {
                    onTodoDeleted?.();
                  }
                  break;
              }
              toolResults.push({
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult),
              });
            } catch (error) {
              const functionCall = 'function' in toolCall ? toolCall.function : null;
              if (functionCall) {
                toolResults.push({
                  role: 'tool' as const,
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({
                    success: false,
                    error: { code: 'EXECUTION_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
                  }),
                });
              }
            }
          }

          // Get follow-up response with tool results
          if (toolResults.length > 0) {
            const followUpResponse = await openai.chat.completions.create({
              model: 'gpt-3.5-turbo',
              max_tokens: 1024,
              messages: [
                ...messages.map((msg) => ({
                  role: msg.role as 'user' | 'assistant',
                  content: msg.content,
                })),
                { role: 'user', content: userMessage },
                message,
                ...toolResults,
              ],
            });

            const followUpMessage = followUpResponse.choices[0].message;
            if (followUpMessage.content) {
              assistantMessage = followUpMessage.content;
            }
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

  const provider = (import.meta.env.VITE_LLM_PROVIDER || 'openai') as LLMProvider;
  const providerName = provider === 'claude' ? 'Claude' : 'OpenAI GPT-3.5';

  return (
    <div className="card">
      <h2>LLM Chat Interface ({providerName})</h2>
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

