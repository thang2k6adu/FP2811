import { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import { getSessionId } from '../lib/session';
import './LLMChatInterface.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LLMChatInterfaceProps {
  onTodoChange?: () => void;
}

export function LLMChatInterface({ onTodoChange }: LLMChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you manage your todos. Try saying "Create a todo to buy groceries with high priority" or "Show me all todos".',
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

  // Convert MCP tool schema to OpenAI function format
  const getOpenAIFunctions = () => {
    return [
      {
        name: 'todo_create',
        description: 'Create a new TODO item',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the TODO',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the TODO (optional)',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Priority level of the TODO',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'todo_list',
        description: 'Get list of TODOs with filtering capabilities',
        parameters: {
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
            search: {
              type: 'string',
              description: 'Search in title and description',
            },
          },
        },
      },
      {
        name: 'todo_update',
        description: 'Update information of a TODO',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the TODO to update',
            },
            title: {
              type: 'string',
              description: 'New title of the TODO',
            },
            description: {
              type: 'string',
              description: 'New description of the TODO',
            },
            completed: {
              type: 'boolean',
              description: 'Completion status',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'New priority level',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'todo_delete',
        description: 'Delete a TODO',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the TODO to delete',
            },
          },
          required: ['id'],
        },
      },
    ];
  };

  // Call MCP tool via proxy
  const callMCPTool = async (toolName: string, params: any) => {
    const sessionId = getSessionId();
    
    const response = await fetch(`${API_BASE_URL}/api/tools/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Tool call failed');
    }

    const result = await response.json();
    
    // Parse the response
    if (result.content && result.content[0] && result.content[0].type === 'text') {
      try {
        return JSON.parse(result.content[0].text);
      } catch (e) {
        return { success: false, error: { message: 'Invalid response format' } };
      }
    }
    
    return result;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!OPENAI_API_KEY) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: input,
        },
        {
          role: 'assistant',
          content: 'Error: VITE_OPENAI_API_KEY is not set. Please add your OpenAI API key to .env file.',
        },
      ]);
      setInput('');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      // Get conversation history
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add system message
      const systemMessage = {
        role: 'system' as const,
        content: 'You are a helpful assistant that manages todos. You can create, list, update, and delete todos using the available tools. Always be concise and helpful.',
      };

      // Call OpenAI with function calling
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [systemMessage, ...conversationHistory, { role: 'user', content: userMessage }],
        tools: getOpenAIFunctions().map((fn) => ({
          type: 'function' as const,
          function: fn,
        })),
        tool_choice: 'auto',
      });

      const message = completion.choices[0].message;

      // Handle tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolResults: any[] = [];

        for (const toolCall of message.tool_calls) {
          // Handle both old and new OpenAI SDK formats
          const functionCall = 'function' in toolCall ? toolCall.function : null;
          if (!functionCall) continue;
          
          const functionName = functionCall.name;
          let functionArgs: any;

          try {
            functionArgs = typeof functionCall.arguments === 'string' 
              ? JSON.parse(functionCall.arguments)
              : functionCall.arguments;
          } catch (e) {
            functionArgs = {};
          }

          try {
            // Call MCP tool
            const toolResult = await callMCPTool(functionName, functionArgs);
            
            // Format result for OpenAI
            let resultContent = '';
            if (toolResult.success) {
              if (functionName === 'todo_list') {
                const todos = toolResult.data?.todos || [];
                resultContent = `Found ${todos.length} todo(s):\n${todos.map((todo: any) => 
                  `- [${todo.completed ? '✓' : ' '}] ${todo.title} (${todo.priority || 'medium'})`
                ).join('\n')}`;
              } else if (functionName === 'todo_create') {
                resultContent = `Successfully created todo: "${toolResult.data?.title}"`;
              } else if (functionName === 'todo_update') {
                resultContent = `Successfully updated todo: "${toolResult.data?.title}"`;
              } else if (functionName === 'todo_delete') {
                resultContent = `Successfully deleted todo`;
              } else {
                resultContent = JSON.stringify(toolResult.data);
              }
            } else {
              resultContent = `Error: ${toolResult.error?.message || 'Unknown error'}`;
            }

            toolResults.push({
              role: 'tool' as const,
              tool_call_id: toolCall.id,
              content: resultContent,
            });

            // Trigger refresh if todo changed
            if (['todo_create', 'todo_update', 'todo_delete'].includes(functionName)) {
              onTodoChange?.();
            }
          } catch (error) {
            toolResults.push({
              role: 'tool' as const,
              tool_call_id: toolCall.id,
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }

        // Get final response from OpenAI
        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            systemMessage,
            ...conversationHistory,
            { role: 'user', content: userMessage },
            message,
            ...toolResults,
          ],
          tools: getOpenAIFunctions().map((fn) => ({
            type: 'function' as const,
            function: fn,
          })),
        });

        const finalMessage = finalCompletion.choices[0].message;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: finalMessage.content || 'Done!',
          },
        ]);
      } else {
        // No tool calls, just respond
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: message.content || 'I apologize, but I could not process your request.',
          },
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
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
    <div className="llm-chat-container">
      <div className="llm-chat-header">
        <h3>AI Assistant (GPT-3.5)</h3>
        {!OPENAI_API_KEY && (
          <div className="api-key-warning">
            Set VITE_OPENAI_API_KEY in .env file
          </div>
        )}
      </div>
      <div className="llm-chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`llm-message llm-message-${msg.role}`}>
            <div className="llm-message-content">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="llm-message llm-message-assistant">
            <div className="llm-message-content">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="llm-chat-input-container">
        <input
          type="text"
          className="llm-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type your message... (e.g., 'Create a todo to buy milk')"
          disabled={loading}
        />
        <button
          className="llm-chat-send-btn"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

