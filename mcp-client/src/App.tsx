import { useState, useEffect } from 'react';
import { UIResourceRenderer } from '@mcp-ui/client';
import { LLMChatInterface } from './components/LLMChatInterface';
import './styles/main.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch UI resource
    const fetchResource = async () => {
      try {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
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
          
          // UIResourceRenderer supports text/html, text/uri-list, and application/vnd.mcp-ui.remote-dom
          // Normalize mimeType: text/html+skybridge -> text/html (adapter suffix is handled internally)
          if (resourceToUse.mimeType && resourceToUse.mimeType.startsWith('text/html')) {
            resourceToUse.mimeType = 'text/html';
          }
          
          console.log('Normalized mimeType:', resourceToUse.mimeType);
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
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { toolName, params } = action.payload;

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
        
        // Return result - UIResourceRenderer will handle sending it back to the iframe
        return result;
      } catch (err) {
        console.error('Error handling UI action:', err);
        return {
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
  
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleTodoChange = () => {
    // Trigger refresh of UI resource
    setRefreshKey((prev) => prev + 1);
  };
  
  return (
    <div className="container" style={{ minHeight: '100vh', width: '100%', padding: '20px' }}>
      <LLMChatInterface onTodoChange={handleTodoChange} />
      <div key={refreshKey}>
        <UIResourceRenderer
          resource={resource}
          onUIAction={handleUIAction}
          htmlProps={{
            autoResizeIframe: { width: true, height: true },
            style: {
              width: '100%',
              minHeight: '600px',
              border: 'none',
              display: 'block',
            },
          }}
        />
      </div>
    </div>
  );
}

export default App;
