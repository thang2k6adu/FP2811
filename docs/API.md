# MCP TODO API Documentation

## Overview

This document describes the 4 MCP tools available in the TODO server.

## Tool: todo_create

Creates a new TODO item.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Title of the TODO",
      "minLength": 1,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "description": "Description of the TODO",
      "maxLength": 1000
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Priority level",
      "default": "medium"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of tags",
      "maxItems": 10
    }
  },
  "required": ["title"]
}
```

### Example Request

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority": "high",
  "tags": ["shopping", "urgent"]
}
```

### Example Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "createdAt": "2025-11-28T10:00:00.000Z",
    "updatedAt": "2025-11-28T10:00:00.000Z",
    "priority": "high",
    "tags": ["shopping", "urgent"]
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and cannot be empty"
  }
}
```

---

## Tool: todo_list

Lists TODOs with optional filtering and sorting.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "completed": {
      "type": "boolean",
      "description": "Filter by completion status"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Filter by priority"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Filter by tags"
    },
    "search": {
      "type": "string",
      "description": "Search in title and description"
    },
    "sortBy": {
      "type": "string",
      "enum": ["createdAt", "updatedAt", "priority", "title"],
      "default": "createdAt"
    },
    "sortOrder": {
      "type": "string",
      "enum": ["asc", "desc"],
      "default": "desc"
    }
  }
}
```

### Example Request

```json
{
  "completed": false,
  "priority": "high",
  "sortBy": "priority",
  "sortOrder": "desc"
}
```

### Example Response

```json
{
  "success": true,
  "data": {
    "todos": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Buy groceries",
        "description": "Milk, eggs, bread",
        "completed": false,
        "createdAt": "2025-11-28T10:00:00.000Z",
        "updatedAt": "2025-11-28T10:00:00.000Z",
        "priority": "high",
        "tags": ["shopping"]
      }
    ],
    "total": 1,
    "filters": {
      "completed": false,
      "priority": "high"
    }
  }
}
```

---

## Tool: todo_update

Updates an existing TODO.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID of the TODO to update",
      "pattern": "^[a-f0-9-]{36}$"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "maxLength": 1000
    },
    "completed": {
      "type": "boolean"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": ["id"]
}
```

### Example Request

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "completed": true,
  "priority": "high"
}
```

### Example Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": true,
    "createdAt": "2025-11-28T10:00:00.000Z",
    "updatedAt": "2025-11-28T11:30:00.000Z",
    "priority": "high",
    "tags": ["shopping"]
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "TODO with id '550e8400-e29b-41d4-a716-446655440000' not found"
  }
}
```

---

## Tool: todo_delete

Deletes a TODO.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID of the TODO to delete",
      "pattern": "^[a-f0-9-]{36}$"
    }
  },
  "required": ["id"]
}
```

### Example Request

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Example Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deleted": true,
    "deletedAt": "2025-11-28T12:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "TODO with id '550e8400-e29b-41d4-a716-446655440000' not found"
  }
}
```

---

## Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server internal error
- `TOOL_ERROR`: Tool execution failed
- `PARSE_ERROR`: Response parsing failed

---

## Data Model

### Todo Object

```typescript
interface Todo {
  id: string;           // UUID v4
  title: string;        // Required, 1-200 characters
  description?: string; // Optional, max 1000 characters
  completed: boolean;   // Default: false
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
  priority?: 'low' | 'medium' | 'high'; // Optional, default: 'medium'
  tags?: string[];      // Optional, max 10 items
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- IDs are UUID v4 format
- Storage is in-memory (data is lost on server restart)
- All string fields are trimmed
- Tags are case-sensitive

