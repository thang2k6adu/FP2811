import { Todo, Priority } from '../types/todo.js';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function TodoItem({ todo, onToggleComplete, onEdit, onDelete, loading }: TodoItemProps) {
  const priorityClass = todo.priority ? `priority-${todo.priority}` : '';

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-content">
        <div className="todo-title">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={(e) => onToggleComplete(todo.id, e.target.checked)}
            disabled={loading}
            style={{ marginRight: '10px' }}
          />
          {todo.title}
        </div>
        {todo.description && (
          <div className="todo-description">{todo.description}</div>
        )}
        <div className="todo-meta">
          {todo.priority && (
            <span className={`priority-badge ${priorityClass}`}>
              {todo.priority.toUpperCase()}
            </span>
          )}
          {todo.tags && todo.tags.length > 0 && (
            <span>Tags: {todo.tags.join(', ')}</span>
          )}
          <span>Created: {new Date(todo.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="todo-actions">
        <button
          onClick={() => onEdit(todo)}
          className="btn-secondary btn-small"
          disabled={loading}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="btn-danger btn-small"
          disabled={loading}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

