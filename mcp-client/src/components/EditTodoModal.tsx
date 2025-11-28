import { useState, useEffect } from 'react';
import { Todo, Priority, TodoUpdateInput } from '../types/todo.js';

interface EditTodoModalProps {
  todo: Todo;
  onSave: (input: TodoUpdateInput) => Promise<boolean>;
  onClose: () => void;
  loading?: boolean;
}

export function EditTodoModal({ todo, onSave, onClose, loading }: EditTodoModalProps) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || '');
  const [completed, setCompleted] = useState(todo.completed);
  const [priority, setPriority] = useState<Priority>(todo.priority || 'medium');
  const [tags, setTags] = useState(todo.tags?.join(', ') || '');

  useEffect(() => {
    setTitle(todo.title);
    setDescription(todo.description || '');
    setCompleted(todo.completed);
    setPriority(todo.priority || 'medium');
    setTags(todo.tags?.join(', ') || '');
  }, [todo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const success = await onSave({
      id: todo.id,
      title: title.trim(),
      description: description.trim() || undefined,
      completed,
      priority,
      tags: tagArray.length > 0 ? tagArray : undefined,
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit TODO</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-title">Title *</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                disabled={loading}
                style={{ marginRight: '5px' }}
              />
              Completed
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="edit-priority">Priority</label>
            <select
              id="edit-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edit-tags">Tags (comma-separated)</label>
            <input
              id="edit-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !title.trim()}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

