import { Todo } from '../types/todo.js';
import { TodoItem } from './TodoItem.js';

interface TodoListProps {
  todos: Todo[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function TodoList({ todos, onToggleComplete, onEdit, onDelete, loading }: TodoListProps) {
  if (loading && todos.length === 0) {
    return (
      <div className="card">
        <div className="loading">Loading todos...</div>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="card">
        <p>No todos found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>TODO List ({todos.length})</h2>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          loading={loading}
        />
      ))}
    </div>
  );
}

