import { createUIResource } from '@mcp-ui/server';

export function createTodoUIResource(): ReturnType<typeof createUIResource> {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP TODO App</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      min-height: 100vh;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      padding-bottom: 40px;
    }
    
    .app-container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      color: white;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    
    .header p {
      opacity: 0.9;
      font-size: 1rem;
    }
    
    .card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    
    .card h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    label {
      display: block;
      margin-bottom: 6px;
      color: #555;
      font-weight: 500;
      font-size: 0.9rem;
    }
    
    input[type="text"],
    textarea,
    select {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s;
      font-family: inherit;
    }
    
    input[type="text"]:focus,
    textarea:focus,
    select:focus {
      outline: none;
      border-color: #667eea;
    }
    
    textarea {
      min-height: 100px;
      resize: vertical;
    }
    
    button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
      font-family: inherit;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .btn-primary:active {
      transform: translateY(0);
    }
    
    .btn-success {
      background: #10b981;
      color: white;
    }
    
    .btn-success:hover {
      background: #059669;
    }
    
    .btn-danger {
      background: #ef4444;
      color: white;
    }
    
    .btn-danger:hover {
      background: #dc2626;
    }
    
    .btn-small {
      padding: 6px 12px;
      font-size: 12px;
    }
    
    .todo-item {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border: 2px solid #f0f0f0;
      border-radius: 12px;
      margin-bottom: 12px;
      background: #fafafa;
      transition: all 0.3s;
    }
    
    .todo-item:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .todo-item.completed {
      opacity: 0.6;
      background: #f5f5f5;
    }
    
    .todo-content {
      flex: 1;
      margin-right: 12px;
    }
    
    .todo-title {
      font-weight: 600;
      margin-bottom: 6px;
      color: #1f2937;
      font-size: 1.1rem;
    }
    
    .todo-item.completed .todo-title {
      text-decoration: line-through;
    }
    
    .todo-description {
      color: #6b7280;
      font-size: 0.9rem;
      margin-bottom: 8px;
    }
    
    .todo-meta {
      display: flex;
      gap: 12px;
      font-size: 0.85rem;
      color: #9ca3af;
      flex-wrap: wrap;
    }
    
    .priority-badge {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .priority-high {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .priority-medium {
      background: #fef3c7;
      color: #92400e;
    }
    
    .priority-low {
      background: #d1fae5;
      color: #065f46;
    }
    
    .todo-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    
    .filters {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .filter-group label {
      margin-bottom: 0;
      font-size: 0.9rem;
    }
    
    .error {
      color: #dc2626;
      padding: 12px;
      background: #fee2e2;
      border-radius: 8px;
      margin-bottom: 16px;
      border-left: 4px solid #dc2626;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #6b7280;
      font-size: 1rem;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #9ca3af;
    }
    
    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .stats {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .stat-item {
      flex: 1;
      background: rgba(255,255,255,0.2);
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      color: white;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .stat-label {
      font-size: 0.85rem;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="app-container">
    <div class="header">
      <h1>📝 MCP TODO</h1>
      <p>Manage your tasks with Model Context Protocol</p>
    </div>
    
    <div id="error-message" class="error" style="display: none;"></div>
    
    <div class="card">
      <h2>➕ Add New Todo</h2>
      <form id="todo-form">
        <div class="form-group">
          <label for="title">Title *</label>
          <input type="text" id="title" name="title" required placeholder="Enter todo title">
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" placeholder="Add a description (optional)"></textarea>
        </div>
        <div class="form-group">
          <label for="priority">Priority</label>
          <select id="priority" name="priority">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button type="submit" class="btn-primary">Create Todo</button>
      </form>
    </div>
    
    <div class="card">
      <h2>🔍 Filters</h2>
      <div class="filters">
        <div class="filter-group">
          <label>
            <input type="checkbox" id="filter-completed"> Show completed
          </label>
        </div>
        <div class="filter-group">
          <label for="filter-priority">Priority:</label>
          <select id="filter-priority">
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-search">Search:</label>
          <input type="text" id="filter-search" placeholder="Search todos...">
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2>📋 Todo List <span id="todo-count" style="color: #667eea;">(0)</span></h2>
      <div id="todo-list" class="loading">Loading todos...</div>
    </div>
  </div>
  
  <script>
    let todos = [];
    let filters = {};
    
    // Helper function to call MCP tools via postMessage
    async function callTool(toolName, params) {
      return new Promise((resolve, reject) => {
        const messageId = Date.now() + Math.random();
        
        const handler = (event) => {
          if (event.data.type === 'tool-response' && event.data.messageId === messageId) {
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.result);
            }
          }
        };
        
        window.addEventListener('message', handler);
        
        // Send tool call request to parent (MCP client)
        window.parent.postMessage({
          type: 'tool',
          payload: {
            toolName: toolName,
            params: params
          },
          messageId: messageId
        }, '*');
        
        // Timeout after 30 seconds
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Tool call timeout'));
        }, 30000);
      });
    }
    
    // Helper to parse tool response
    function parseToolResponse(response) {
      if (response.content && response.content[0] && response.content[0].type === 'text') {
        try {
          return JSON.parse(response.content[0].text);
        } catch (e) {
          return { success: false, error: { message: 'Invalid response format' } };
        }
      }
      return { success: false, error: { message: 'No content in response' } };
    }
    
    // Load todos
    async function loadTodos() {
      try {
        const response = await callTool('todo_list', filters);
        const result = parseToolResponse(response);
        
        if (result.success) {
          todos = result.data.todos || [];
          renderTodos();
        } else {
          showError(result.error?.message || 'Failed to load todos');
        }
      } catch (error) {
        showError('Error loading todos: ' + error.message);
      }
    }
    
    // Render todos
    function renderTodos() {
      const todoList = document.getElementById('todo-list');
      const todoCount = document.getElementById('todo-count');
      
      todoCount.textContent = todos.length;
      
      if (todos.length === 0) {
        todoList.innerHTML = \`
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
            </svg>
            <p>No todos found. Create one to get started!</p>
          </div>
        \`;
        return;
      }
      
      todoList.innerHTML = todos.map(todo => \`
        <div class="todo-item \${todo.completed ? 'completed' : ''}">
          <div class="todo-content">
            <div class="todo-title">\${escapeHtml(todo.title)}</div>
            \${todo.description ? \`<div class="todo-description">\${escapeHtml(todo.description)}</div>\` : ''}
            <div class="todo-meta">
              <span class="priority-badge priority-\${todo.priority}">\${todo.priority}</span>
              <span>📅 \${new Date(todo.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div class="todo-actions">
            <button class="btn-small \${todo.completed ? 'btn-secondary' : 'btn-success'}" 
                    onclick="toggleTodo('\${todo.id}', \${!todo.completed})">
              \${todo.completed ? '↩️ Undo' : '✅ Complete'}
            </button>
            <button class="btn-small btn-danger" onclick="deleteTodo('\${todo.id}')">🗑️ Delete</button>
          </div>
        </div>
      \`).join('');
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // Toggle todo completion
    async function toggleTodo(id, completed) {
      try {
        const response = await callTool('todo_update', { id, completed });
        const result = parseToolResponse(response);
        
        if (result.success) {
          await loadTodos();
        } else {
          showError(result.error?.message || 'Failed to update todo');
        }
      } catch (error) {
        showError('Error updating todo: ' + error.message);
      }
    }
    
    // Delete todo
    async function deleteTodo(id) {
      if (!confirm('Are you sure you want to delete this todo?')) {
        return;
      }
      
      try {
        const response = await callTool('todo_delete', { id });
        const result = parseToolResponse(response);
        
        if (result.success) {
          await loadTodos();
        } else {
          showError(result.error?.message || 'Failed to delete todo');
        }
      } catch (error) {
        showError('Error deleting todo: ' + error.message);
      }
    }
    
    // Show error message
    function showError(message) {
      const errorDiv = document.getElementById('error-message');
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
    
    // Handle form submission
    document.getElementById('todo-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const title = formData.get('title');
      const description = formData.get('description') || '';
      const priority = formData.get('priority');
      
      try {
        const response = await callTool('todo_create', {
          title,
          description: description || undefined,
          priority
        });
        const result = parseToolResponse(response);
        
        if (result.success) {
          e.target.reset();
          await loadTodos();
        } else {
          showError(result.error?.message || 'Failed to create todo');
        }
      } catch (error) {
        showError('Error creating todo: ' + error.message);
      }
    });
    
    // Handle filter changes
    document.getElementById('filter-completed').addEventListener('change', (e) => {
      filters.completed = e.target.checked ? undefined : false;
      loadTodos();
    });
    
    document.getElementById('filter-priority').addEventListener('change', (e) => {
      filters.priority = e.target.value || undefined;
      loadTodos();
    });
    
    document.getElementById('filter-search').addEventListener('input', (e) => {
      filters.search = e.target.value || undefined;
      loadTodos();
    });
    
    // Make functions globally available
    window.toggleTodo = toggleTodo;
    window.deleteTodo = deleteTodo;
    
    // Initial load
    loadTodos();
  </script>
</body>
</html>
  `;

  return createUIResource({
    uri: 'ui://todo/interface',
    content: {
      type: 'rawHtml',
      htmlString: htmlContent,
    },
    encoding: 'text',
    adapters: {
      appsSdk: {
        enabled: true,
        config: {
          intentHandling: 'ignore',
        },
      },
    },
  });
}

