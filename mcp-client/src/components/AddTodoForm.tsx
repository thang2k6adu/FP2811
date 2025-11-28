import { useState } from 'react';
import { Priority, TodoCreateInput } from '../types/todo.js';

interface AddTodoFormProps {
  onSubmit: (input: TodoCreateInput) => Promise<boolean>;
  loading?: boolean;
}

export function AddTodoForm({ onSubmit, loading }: AddTodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [tags, setTags] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const success = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      tags: tagArray.length > 0 ? tagArray : undefined,
    });

    if (success) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setTags('');
    }
  };

  return (
    <div className="card">
      <h2>Add New TODO</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter todo title"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            placeholder="Enter todo description (optional)"
          />
        </div>
        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
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
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={loading}
            placeholder="shopping, work, personal"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading || !title.trim()}>
          {loading ? 'Adding...' : 'Add TODO'}
        </button>
      </form>
    </div>
  );
}

