import { useState, useEffect, useRef } from 'react';
import { UIResourceRenderer } from '@mcp-ui/client';
import { LLMChatInterface } from './components/LLMChatInterface';
import { getSessionId } from './lib/session';
import './styles/main.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleTodoChange = () => {
    // Send a message to iframe to reload todos
    console.log('🔄 handleTodoChange called - attempting to reload todos in iframe');
    const sendReloadMessage = (attempt = 1) => {
      // Try to use ref first, then fallback to querySelector
      const iframe = iframeRef.current || document.querySelector('iframe');
      console.log(`Looking for iframe (attempt ${attempt}):`, {
        found: !!iframe,
        fromRef: !!iframeRef.current,
        hasContentWindow: !!iframe?.contentWindow,
        iframeSrc: iframe?.src,
        iframeSrcdoc: !!iframe?.srcdoc,
      });
      
      if (iframe && iframe.contentWindow) {
        const message = { type: 'reload-todos', timestamp: Date.now() };
        try {
          iframe.contentWindow.postMessage(message, '*');
          console.log('✅ Sent reload-todos message to iframe:', message);
        } catch (error) {
          console.error('❌ Error sending message to iframe:', error);
        }
      } else {
        console.warn(`⚠️ Could not find iframe or iframe.contentWindow is not available (attempt ${attempt})`);
      }
    };
    
    // Try multiple times with increasing delays to ensure iframe is ready
    sendReloadMessage(1);
    setTimeout(() => sendReloadMessage(2), 100);
    setTimeout(() => sendReloadMessage(3), 300);
    setTimeout(() => sendReloadMessage(4), 600);
    setTimeout(() => sendReloadMessage(5), 1000);
  };

  // Store iframe reference when it's rendered
  useEffect(() => {
    if (resource) {
      const checkAndStoreIframe = () => {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframeRef.current = iframe;
          console.log('✅ Stored iframe reference:', {
            exists: !!iframe,
            hasContentWindow: !!iframe.contentWindow,
            src: iframe.src,
          });
        }
      };
      
      // Check immediately and also after delays
      checkAndStoreIframe();
      const timer1 = setTimeout(checkAndStoreIframe, 500);
      const timer2 = setTimeout(checkAndStoreIframe, 1000);
      const timer3 = setTimeout(checkAndStoreIframe, 2000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [resource]);

  // Listen for postMessage from iframe and handle tool calls directly
  useEffect(() => {
    if (!resource) return;

    const handleMessage = async (event: MessageEvent) => {
      // Only handle messages from our iframe with type 'tool'
      if (event.data && event.data.type === 'tool') {
        // Handle both formats: event.data.payload and event.data directly
        const payload = event.data.payload || event.data;
        const messageId = event.data.messageId;
        
        // Extract toolName from payload
        const toolName = payload?.toolName || event.data.toolName;
        const params = payload?.params || event.data.params || {};
        
        // Validate toolName
        if (!toolName) {
          console.error('Tool name is undefined. Full event.data:', event.data);
          const iframe = document.querySelector('iframe');
          if (iframe && iframe.contentWindow && messageId) {
            iframe.contentWindow.postMessage({
              type: 'tool-response',
              messageId: messageId,
              error: 'Tool name is undefined',
            }, '*');
          }
          return;
        }
        
        console.log('Received postMessage from iframe:', { toolName, params, messageId, fullData: event.data });
        
        try {
          const sessionId = getSessionId();
          
          // Call tool via proxy
          const response = await fetch(`${API_BASE_URL}/api/tools/${toolName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Id': sessionId,
            },
            body: JSON.stringify(params || {}),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Tool call failed');
          }

          const result = await response.json();
          console.log('Tool call result (from postMessage):', result);
          console.log('Result structure:', {
            hasContent: !!result.content,
            contentLength: result.content?.length,
            firstContent: result.content?.[0],
          });
          
          // Send response back to iframe immediately
          // Don't use setTimeout as it might cause timing issues
          const iframe = document.querySelector('iframe');
          if (iframe && iframe.contentWindow && messageId) {
            try {
              // Ensure messageId is a number (not string)
              const numericMessageId = typeof messageId === 'string' ? parseFloat(messageId) : messageId;
              const finalResponseMessage = {
                type: 'tool-response',
                messageId: numericMessageId,
                result: result,
              };
              
              iframe.contentWindow.postMessage(finalResponseMessage, '*');
              console.log('Sent response to iframe:', {
                type: finalResponseMessage.type,
                messageId: finalResponseMessage.messageId,
                messageIdType: typeof finalResponseMessage.messageId,
                hasResult: !!finalResponseMessage.result,
                resultContent: finalResponseMessage.result?.content,
                resultContentText: finalResponseMessage.result?.content?.[0]?.text,
                iframeSrc: iframe.src,
              });
            } catch (err) {
              console.error('Error sending message to iframe:', err);
              // Retry after a short delay
              setTimeout(() => {
                if (iframe.contentWindow) {
                  const numericMessageId = typeof messageId === 'string' ? parseFloat(messageId) : messageId;
                  iframe.contentWindow.postMessage({
                    type: 'tool-response',
                    messageId: numericMessageId,
                    result: result,
                  }, '*');
                }
              }, 100);
            }
          } else {
            console.warn('Could not find iframe or messageId missing', {
              hasIframe: !!iframe,
              hasContentWindow: !!iframe?.contentWindow,
              hasMessageId: !!messageId,
            });
            // Retry after a short delay
            setTimeout(() => {
              const retryIframe = document.querySelector('iframe');
              if (retryIframe && retryIframe.contentWindow && messageId) {
                retryIframe.contentWindow.postMessage({
                  type: 'tool-response',
                  messageId: messageId,
                  result: result,
                }, '*');
              }
            }, 200);
          }
          
          // Trigger refresh if todo changed
          // Note: We don't need to call handleTodoChange here because
          // the iframe will automatically reload todos after receiving the response
          // But we can send a reload message as backup
          if (['todo_create', 'todo_update', 'todo_delete'].includes(toolName)) {
            console.log('Todo changed, sending reload message to iframe');
            setTimeout(() => {
              const iframe = document.querySelector('iframe');
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                  type: 'reload-todos',
                }, '*');
              }
            }, 300);
          }
        } catch (err) {
          console.error('Error handling tool call:', err);
          setTimeout(() => {
            const iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow && messageId) {
              iframe.contentWindow.postMessage({
                type: 'tool-response',
                messageId: messageId,
                error: err instanceof Error ? err.message : 'Unknown error',
              }, '*');
            }
          }, 50);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [resource]);

  useEffect(() => {
    // Fetch UI resource
    const fetchResource = async () => {
      try {
        const sessionId = getSessionId();
        
        // List resources
        const resourcesResponse = await fetch(`${API_BASE_URL}/api/resources`, {
          headers: {
            'X-Session-Id': sessionId,
          },
        });

        if (!resourcesResponse.ok) {
          throw new Error('Failed to list resources');
        }

        const resources = await resourcesResponse.json();
        const todoResource = resources.resources?.find((r: any) => r.uri === 'ui://todo/interface');

        if (!todoResource) {
          throw new Error('TODO UI resource not found');
        }

        // Read the resource
        const resourceResponse = await fetch(
          `${API_BASE_URL}/api/resources/${encodeURIComponent(todoResource.uri)}`,
          {
            headers: {
              'X-Session-Id': sessionId,
            },
          }
        );

        if (!resourceResponse.ok) {
          throw new Error('Failed to read resource');
        }

        const resourceData = await resourceResponse.json();
        const resourceContent = resourceData.contents?.[0];

        if (!resourceContent) {
          throw new Error('No content in resource');
        }

        // Parse the UI resource from JSON string
        // createUIResource returns { type: "resource", resource: {...} }
        const uiResource = JSON.parse(resourceContent.text);
        console.log('Parsed UI Resource:', uiResource);
        console.log('Resource content:', resourceContent);
        
        // UIResourceRenderer expects the resource property, not the whole object
        if (uiResource.type === 'resource' && uiResource.resource) {
          const resourceToUse = { ...uiResource.resource };
          console.log('Resource to use:', resourceToUse);
          console.log('Resource mimeType:', resourceToUse.mimeType);
          console.log('Resource text length:', resourceToUse.text?.length);
          
          // UIResourceRenderer supports text/html, text/uri-list, and application/vnd.mcp-ui.remote-dom
          // Normalize mimeType: text/html+skybridge -> text/html (adapter suffix is handled internally)
          if (resourceToUse.mimeType && resourceToUse.mimeType.startsWith('text/html')) {
            resourceToUse.mimeType = 'text/html';
          }
          
          // Ensure text content exists
          if (!resourceToUse.text && resourceToUse.content) {
            resourceToUse.text = resourceToUse.content;
          }
          
          console.log('Normalized mimeType:', resourceToUse.mimeType);
          console.log('Final resource:', {
            uri: resourceToUse.uri,
            mimeType: resourceToUse.mimeType,
            hasText: !!resourceToUse.text,
            textPreview: resourceToUse.text?.substring(0, 100),
          });
          setResource(resourceToUse);
          setError(null);
        } else {
          console.error('Invalid UI resource format:', uiResource);
          throw new Error('Invalid UI resource format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load UI resource');
        console.error('Error fetching resource:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, []);

  // Handle UI actions (tool calls from the UI resource)
  const handleUIAction = async (action: any) => {
    console.log('UI Action received:', action);
    
    if (action.type === 'tool' && action.payload) {
      try {
        const sessionId = getSessionId();
        const { toolName, params } = action.payload;
        const messageId = action.messageId;

        // Call tool via proxy
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
        console.log('Tool call result:', result);
        
        // Send response back to iframe via postMessage
        // The iframe is listening for 'tool-response' messages
        if (messageId) {
          const iframe = document.querySelector('iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'tool-response',
              messageId: messageId,
              result: result,
            }, '*');
          }
        }
        
        // Return result - UIResourceRenderer may also handle it
        return result;
      } catch (err) {
        console.error('Error handling UI action:', err);
        const errorResult = {
          isError: true,
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                message: err instanceof Error ? err.message : 'Unknown error',
              },
            }),
          }],
        };
        
        // Send error response to iframe
        if (action.messageId) {
          const iframe = document.querySelector('iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'tool-response',
              messageId: action.messageId,
              error: err instanceof Error ? err.message : 'Unknown error',
            }, '*');
          }
        }
        
        return errorResult;
      }
    }
    
    // Return empty result for non-tool actions
    return {
      content: [],
    };
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading TODO interface...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button
          className="btn-primary"
          onClick={() => {
            setLoading(true);
            setError(null);
            window.location.reload();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="container">
        <div className="error">No UI resource available</div>
      </div>
    );
  }

  console.log('Rendering with resource:', resource);
  
  return (
    <div className="container" style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      minHeight: '100vh', 
      width: '100%', 
      padding: '20px',
      gap: '20px'
    }}>
      <div style={{ width: '400px', flexShrink: 0 }}>
        <LLMChatInterface onTodoChange={handleTodoChange} />
      </div>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {resource ? (
          <UIResourceRenderer
            resource={resource}
            onUIAction={handleUIAction}
            htmlProps={{
              autoResizeIframe: { width: true, height: true },
              style: {
                width: '100%',
                minHeight: '600px',
                border: '1px solid #e0e0e0',
                display: 'block',
                backgroundColor: '#fff',
              },
            }}
          />
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <div>Loading UI resource...</div>
            <div style={{ marginTop: '10px', fontSize: '12px' }}>
              Resource: {resource ? 'Loaded' : 'Not loaded'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
