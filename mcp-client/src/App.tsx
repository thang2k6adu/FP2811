import { useState } from 'react';
import { useMCPClient } from './hooks/useMCPClient.js';
import { useTodos } from './hooks/useTodos.js';
import { AddTodoForm } from './components/AddTodoForm.js';
import { TodoFilters } from './components/TodoFilters.js';
import { TodoList } from './components/TodoList.js';
import { EditTodoModal } from './components/EditTodoModal.js';
import { LLMChatInterface } from './components/LLMChatInterface.js';
import { Todo } from './types/todo.js';
import './styles/main.css';

function App() {
  const { client, connected, error: connectionError } = useMCPClient();
  const {
    todos,
    loading,
    error: todosError,
    createTodo,
    updateTodo,
    deleteTodo,
    applyFilters,
    refresh,
  } = useTodos(client);

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const handleToggleComplete = async (id: string, completed: boolean) => {
    await updateTodo({ id, completed });
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this todo?')) {
      await deleteTodo(id);
    }
  };

  const error = connectionError || todosError;

  return (
    <div className="container">
      <h1>MCP TODO Application</h1>
      
      {!connected && (
        <div className="error">
          {connectionError || 'Connecting to MCP server...'}
        </div>
      )}

      {error && connected && (
        <div className="error">{error}</div>
      )}

      {connected && (
        <>
          <LLMChatInterface
            mcpClient={client}
            onTodoCreated={refresh}
            onTodoUpdated={refresh}
            onTodoDeleted={refresh}
          />

          <AddTodoForm onSubmit={createTodo} loading={loading} />

          <TodoFilters onFilterChange={applyFilters} loading={loading} />

          <TodoList
            todos={todos}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />

          {editingTodo && (
            <EditTodoModal
              todo={editingTodo}
              onSave={async (input) => {
                const success = await updateTodo(input);
                if (success) {
                  setEditingTodo(null);
                }
                return success;
              }}
              onClose={() => setEditingTodo(null)}
              loading={loading}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;

