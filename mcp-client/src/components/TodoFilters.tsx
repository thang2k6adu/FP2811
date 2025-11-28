import { useState } from 'react';
import { TodoListFilters, Priority } from '../types/todo.js';

interface TodoFiltersProps {
  onFilterChange: (filters: TodoListFilters) => void;
  loading?: boolean;
}

export function TodoFilters({ onFilterChange, loading }: TodoFiltersProps) {
  const [completed, setCompleted] = useState<boolean | undefined>(undefined);
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [search, setSearch] = useState('');

  const applyFilters = () => {
    const filters: TodoListFilters = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    if (completed !== undefined) filters.completed = completed;
    if (priority) filters.priority = priority;
    if (search.trim()) filters.search = search.trim();
    onFilterChange(filters);
  };

  const clearFilters = () => {
    setCompleted(undefined);
    setPriority(undefined);
    setSearch('');
    onFilterChange({ sortBy: 'createdAt', sortOrder: 'desc' });
  };

  return (
    <div className="card">
      <h2>Filters</h2>
      <div className="filters">
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={completed === false}
              onChange={(e) => setCompleted(e.target.checked ? false : undefined)}
              disabled={loading}
            />
            Incomplete
          </label>
        </div>
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={completed === true}
              onChange={(e) => setCompleted(e.target.checked ? true : undefined)}
              disabled={loading}
            />
            Completed
          </label>
        </div>
        <div className="filter-group">
          <select
            value={priority || ''}
            onChange={(e) => setPriority(e.target.value as Priority || undefined)}
            disabled={loading}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="filter-group">
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
            style={{ width: '200px' }}
          />
        </div>
        <button onClick={applyFilters} className="btn-primary" disabled={loading}>
          Apply Filters
        </button>
        <button onClick={clearFilters} className="btn-secondary" disabled={loading}>
          Clear
        </button>
      </div>
    </div>
  );
}

