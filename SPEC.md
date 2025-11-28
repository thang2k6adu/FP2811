# MCP TODO Demo Application - Technical Specification

## 1. Project Overview

### 1.1. Purpose
Build a complete demo application showcasing the capabilities of Model Context Protocol (MCP) through a simple yet fully functional TODO application.

### 1.2. Scope
- **MCP Server**: Provides 4 tools for TODO management via MCP protocol
- **MCP-UI Client**: Web interface for interacting with MCP server
- **LLM Integration**: Integrate LLM model client for testing and natural language interaction
- **Documentation**: Complete guide for setup and running the application

### 1.3. Main Requirements from Client
> "Build a minimal MCP server exposing four tools: todo_create, todo_list, todo_update, and todo_delete, each with clear JSON schemas. Create a small MCP-UI client where users can add todos, list them, edit them, and delete them through buttons tied to these MCP tools."

> **Important Hint**: "if you don't use a model llm client to test your work, it means you are on the wrong track"

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MCP-UI CLIENT                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web UI     │  │  LLM Chat    │  │  MCP Client  │ │
│  │  (Buttons)   │  │  Interface   │  │   Library    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │ MCP Protocol (stdio/SSE)
┌─────────────────────────▼───────────────────────────────┐
│                    MCP SERVER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  MCP Tools   │  │   Business   │  │   Storage    │ │
│  │  Handlers    │  │    Logic     │  │   Layer      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. MCP Server Specification

### 3.1. Technology
- **Runtime**: Node.js (TypeScript) or Python
- **MCP SDK**: `@modelcontextprotocol/sdk` (Node.js) or `mcp` (Python)
- **Storage**: In-memory or JSON file (for simplicity)
- **Transport**: stdio (standard input/output)

### 3.2. TODO Data Model

```typescript
interface Todo {
  id: string;           // UUID v4
  title: string;        // TODO title
  description?: string; // Detailed description (optional)
  completed: boolean;   // Completion status
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
  priority?: 'low' | 'medium' | 'high'; // Priority level (optional)
  tags?: string[];      // Tags/labels (optional)
}
```

### 3.3.  MCP Tools Specification

#### 3.3.1. Tool: `todo_create`

**Description**: Create a new TODO item

**Input Schema**:
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
      "description": "Detailed description of the TODO",
      "maxLength": 1000
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Priority level of the TODO",
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

**Output**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "createdAt": "2025-11-28T10:00:00Z",
    "updatedAt": "2025-11-28T10:00:00Z",
    "priority": "medium",
    "tags": ["shopping"]
  }
}
```

**Error Handling**:
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

#### 3.3.2. Tool: `todo_list`

**Description**: Get list of TODOs with filtering capabilities

**Input Schema**:
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
      "description": "Filter by priority level"
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

**Output**:
```json
{
  "success": true,
  "data": {
    "todos": [
      {
        "id": "uuid-1",
        "title": "Buy groceries",
        "completed": false,
        "createdAt": "2025-11-28T10:00:00Z",
        "updatedAt": "2025-11-28T10:00:00Z",
        "priority": "high"
      }
    ],
    "total": 1,
    "filters": {
      "completed": false
    }
  }
}
```

---

#### 3.3.3. Tool: `todo_update`

**Description**: Update information of a TODO

**Input Schema**:
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

**Output**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "title": "Buy groceries (updated)",
    "description": "Milk, eggs, bread, cheese",
    "completed": true,
    "createdAt": "2025-11-28T10:00:00Z",
    "updatedAt": "2025-11-28T11:30:00Z",
    "priority": "high",
    "tags": ["shopping", "urgent"]
  }
}
```

**Error Handling**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "TODO with id 'uuid-here' not found"
  }
}
```

---

#### 3.3.4.  Tool: `todo_delete`

**Description**: Delete a TODO

**Input Schema**:
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

**Output**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "deleted": true,
    "deletedAt": "2025-11-28T12:00:00Z"
  }
}
```

**Error Handling**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "TODO with id 'uuid-here' not found"
  }
}
```

---

## 4. MCP-UI Client Specification

### 4.1. Technology
- **Framework**: React, Vue, or vanilla HTML/CSS/JS
- **MCP Client**: `@modelcontextprotocol/sdk` Client library
- **Styling**: Tailwind CSS or minimal CSS
- **State Management**: React hooks or Vue composition API

### 4.2. UI Components

#### 4.2. 1. Layout Structure
```
┌─────────────────────────────────────────────────────┐
│              MCP TODO Application                   │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │  LLM Chat Interface                           │ │
│  │  "Create a todo: buy milk"                    │ │
│  │  "Show me all high priority todos"            │ │
│  └───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │  Add TODO Form                                │ │
│  │  [Title Input]                                │ │
│  │  [Description Textarea]                       │ │
│  │  [Priority Dropdown] [Tags Input]             │ │
│  │  [Add TODO Button]                            │ │
│  └───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │  Filters                                      │ │
│  │  [ ] Completed  [Priority ▼]  [Search...]    │ │
│  └───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │  TODO List                                    │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │ ☐ Buy groceries          [Edit] [Delete]│ │ │
│  │  │   Priority: High | Tags: shopping       │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │ ☑ Finish report          [Edit] [Delete]│ │ │
│  │  │   Priority: Medium | Tags: work         │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### 4.2.2. Component Breakdown

**1. LLMChatInterface Component**
- Text input for natural language commands
- Message history display
- Auto-scroll to latest message
- Loading indicator when processing

**2. AddTodoForm Component**
- Title input (required)
- Description textarea (optional)
- Priority select dropdown
- Tags input (comma-separated)
- Submit button calls MCP `todo_create`

**3. TodoFilters Component**
- Completed checkbox
- Priority dropdown
- Search input
- Sort options
- Filter button calls MCP `todo_list` with filters

**4. TodoList Component**
- Render list of TODOs
- Checkbox to toggle completed
- Edit button opens modal/inline edit
- Delete button with confirmation

**5. TodoItem Component**
- Display title, description, priority, tags
- Checkbox calls MCP `todo_update` to toggle completed
- Edit button
- Delete button calls MCP `todo_delete`

**6. EditTodoModal Component**
- Form similar to AddTodoForm
- Pre-fill data
- Submit button calls MCP `todo_update`

### 4.3. MCP Client Integration

**Connection Setup**:
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['path/to/mcp-server/index.js']
});

const client = new Client({
  name: 'mcp-todo-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);
```

**Tool Call Example**:
```typescript
// Create TODO
const result = await client.callTool({
  name: 'todo_create',
  arguments: {
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
    priority: 'high',
    tags: ['shopping']
  }
});

// List TODOs
const todos = await client.callTool({
  name: 'todo_list',
  arguments: {
    completed: false,
    sortBy: 'priority',
    sortOrder: 'desc'
  }
});

// Update TODO
const updated = await client.callTool({
  name: 'todo_update',
  arguments: {
    id: 'todo-uuid',
    completed: true
  }
});

// Delete TODO
const deleted = await client.callTool({
  name: 'todo_delete',
  arguments: {
    id: 'todo-uuid'
  }
});
```

### 4.4. LLM Integration (IMPORTANT!)

**Requirement**: Must integrate LLM model client to test MCP tools

**Implementation Options**:

**Option 1: Claude Desktop Integration**
- Configure MCP server in Claude Desktop config
- User can chat with Claude to interact with TODOs
- Example: "Create a todo to buy milk with high priority"

**Option 2: Built-in LLM Client**
- Integrate Anthropic API directly
- Chat interface in web UI
- LLM uses MCP tools to perform actions

**Option 3: OpenAI Function Calling**
- Use OpenAI API with function calling
- Map MCP tools to OpenAI functions
- Natural language interface

**Recommended: Option 1 + Option 2**
```typescript
// LLM Chat Handler
async function handleLLMChat(userMessage: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    tools: [
      {
        name: 'todo_create',
        description: 'Create a new TODO item',
        input_schema: { /* JSON schema */ }
      },
      // ...  other tools
    ],
    messages: [{
      role: 'user',
      content: userMessage
    }]
  });

  // Handle tool use
  if (response.stop_reason === 'tool_use') {
    const toolUse = response. content. find(c => c.type === 'tool_use');
    const result = await client.callTool({
      name: toolUse.name,
      arguments: toolUse.input
    });
    return result;
  }
}
```

---

## 5. Project Directory Structure

```
mcp-todo-demo/
├── README.md                 # Main guide
├── SPECIFICATION.md          # This file
├── LICENSE                   # MIT License
├── .gitignore
│
├── mcp-server/              # MCP Server
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts         # Entry point
│   │   ├── server.ts        # MCP server setup
│   │   ├── tools/
│   │   │   ├── todo-create.ts
│   │   │   ├── todo-list.ts
│   │   │   ├── todo-update.ts
│   │   │   └── todo-delete.ts
│   │   ├── storage/
│   │   │   └── todo-storage.ts
│   │   └── types/
│   │       └── todo. ts
│   └── dist/                # Compiled output
│
├── mcp-client/              # MCP UI Client
│   ├── package. json
│   ├── tsconfig.json
│   ├── vite.config.ts       # Vite config
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx         # Entry point
│   │   ├── App.tsx          # Main component
│   │   ├── components/
│   │   │   ├── LLMChatInterface.tsx
│   │   │   ├── AddTodoForm.tsx
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   ├── TodoFilters.tsx
│   │   │   └── EditTodoModal.tsx
│   │   ├── hooks/
│   │   │   ├── useMCPClient.ts
│   │   │   └── useTodos.ts
│   │   ├── lib/
│   │   │   └── mcp-client.ts
│   │   └── styles/
│   │       └── main.css
│   └── dist/                # Build output
│
├── docs/                    # Documentation
│   ├── API.md              # API documentation
│   ├── SETUP.md            # Setup guide
│   └── TESTING.md          # Testing guide
│
└── examples/               # Example configurations
    ├── claude-desktop-config. json
    └── sample-todos.json
```

---

## 6. Setup & Installation

### 6.1. Prerequisites
- Node.js >= 18.x
- npm or pnpm
- Claude Desktop (optional, for LLM testing)

### 6.2. Installation Steps

**1. Clone repository**:
```bash
git clone https://github.com/yourusername/mcp-todo-demo.git
cd mcp-todo-demo
```

**2. Setup MCP Server**:
```bash
cd mcp-server
npm install
npm run build
```

**3. Setup MCP Client**:
```bash
cd ../mcp-client
npm install
npm run dev
```

**4. Configure Claude Desktop** (Optional):
```json
{
  "mcpServers": {
    "todo": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

### 6.3. Running the Application

**Start MCP Server**:
```bash
cd mcp-server
npm run dev
```

**Start UI Client**:
```bash
cd mcp-client
npm run dev
```

Access UI at: `http://localhost:5173`

---

## 7. Testing Requirements

### 7.1. Unit Tests
- Test each MCP tool handler
- Test storage layer
- Test validation logic

### 7.2. Integration Tests
- Test MCP client-server communication
- Test tool chaining
- Test error handling

### 7.3. LLM Testing (REQUIRED!)
**Must test with LLM model client**:

**Test Cases**:
1. "Create a todo to buy milk"
   - Expected: LLM calls `todo_create` tool
   
2. "Show me all incomplete todos"
   - Expected: LLM calls `todo_list` with filter completed=false
   
3. "Mark the milk todo as completed"
   - Expected: LLM calls `todo_list` → finds todo → calls `todo_update`
   
4. "Delete all completed todos"
   - Expected: LLM calls `todo_list` → calls `todo_delete` multiple times

5. "Create 3 todos: buy milk (high priority), finish report (medium), call mom (low)"
   - Expected: LLM calls `todo_create` 3 times

**Testing Tools**:
- Claude Desktop with MCP server configured
- Built-in LLM chat interface in UI
- MCP Inspector tool

---

## 8. Documentation Requirements

### 8.1. README.md
Must include:
- Project overview
- Quick start guide
- Screenshots/GIFs
- Architecture diagram
- Troubleshooting
- Contributing guidelines

### 8.2. API.md
- Detailed API documentation for each MCP tool
- Request/response examples
- Error codes and handling

### 8.3. SETUP.md
- Step-by-step setup instructions
- Environment configuration
- Claude Desktop integration
- LLM testing setup

### 8.4. TESTING.md
- How to run tests
- LLM test scenarios
- Expected behaviors
- Debugging tips

---

## 9. Non-Functional Requirements

### 9.1. Performance
- Tool response time < 100ms (in-memory storage)
- UI responsive, no lag
- Support 1000+ TODOs without performance issues

### 9.2. Security
- Input validation on server
- Sanitize user inputs
- No injection vulnerabilities

### 9.3. Code Quality
- TypeScript with strict mode
- ESLint configuration
- Prettier formatting
- Clear comments and documentation

### 9.4. User Experience
- Clean, minimal UI
- Clear error messages
- Loading states
- Success/error notifications
- Keyboard shortcuts support

---

## 10.  Deliverables

### 10.1. Code
- ✅ MCP Server with 4 tools
- ✅ MCP UI Client with React/Vue
- ✅ LLM Chat interface
- ✅ Storage layer
- ✅ Type definitions
- ✅ Tests

### 10.2. Documentation
- ✅ README.md
- ✅ SPECIFICATION.md (this file)
- ✅ API.md
- ✅ SETUP.md
- ✅ TESTING.md

### 10.3. Configuration
- ✅ package.json files
- ✅ TypeScript configs
- ✅ Claude Desktop config example
- ✅ .env.example

### 10.4. Examples
- ✅ Sample TODO data
- ✅ Test scenarios
- ✅ LLM prompts examples

---

## 11. Success Criteria

✅ **MCP Server**:
- 4 tools working correctly
- Clear JSON schemas
- Proper error handling
- Documented API

✅ **MCP UI Client**:
- CRUD operations via UI buttons
- Filters and search working
- Responsive design
- LLM chat interface working

✅ **LLM Integration**:
- Can test with Claude Desktop
- Natural language commands work
- LLM correctly uses MCP tools
- Examples documented

✅ **Documentation**:
- Clear setup instructions
- Can run server and client in < 5 minutes
- All features documented
- Troubleshooting guide included

✅ **Code Quality**:
- TypeScript, no `any` types
- Linted and formatted
- No console errors
- Tests passing

---

## 12. Timeline Estimate

- **Phase 1 - MCP Server** (4-6 hours):
  - Setup project structure
  - Implement 4 tools
  - Storage layer
  - Testing

- **Phase 2 - MCP UI Client** (6-8 hours):
  - Setup React/Vue project
  - Build UI components
  - MCP client integration
  - Styling

- **Phase 3 - LLM Integration** (4-6 hours):
  - LLM chat interface
  - Claude Desktop config
  - Testing with LLM
  - Fine-tuning

- **Phase 4 - Documentation** (2-4 hours):
  - Write all docs
  - Create examples
  - Screenshots/GIFs
  - Final review

**Total**: 16-24 hours

---

## 13. Technical Decisions

### 13.1. Why Node.js + TypeScript?
- MCP SDK has good support
- Type safety
- Large ecosystem
- Easy deployment

### 13.2. Why In-Memory Storage?
- Simplicity
- No database setup needed
- Fast for demo
- Can upgrade to SQLite/PostgreSQL later

### 13.3. Why React + Vite?
- Fast development
- Modern tooling
- Great DX
- Easy deployment

### 13.4. Why Claude API?
- Best MCP support
- Natural integration
- Powerful reasoning
- Tool use capabilities

---

## 14. Future Enhancements

Features that can be added later:
- [ ] Due dates and reminders
- [ ] Categories/projects
- [ ] Collaboration/sharing
- [ ] Persistent storage (SQLite/PostgreSQL)
- [ ] Authentication
- [ ] Mobile app
- [ ] Browser extension
- [ ] Sync across devices
- [ ] Export/import (JSON, CSV)
- [ ] Recurring todos
- [ ] Sub-tasks
- [ ] File attachments

---

## 15. References

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude API Documentation](https://docs.anthropic.com)
- [JSON Schema](https://json-schema. org)

---

## 16. Contact & Support

For questions about this specification:
- Create an issue in GitHub repo
- Email: your-email@example.com
- Discord: Your Discord handle

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-28  
**Author**: thang2k6adu  
**Status**: Draft → Ready for Implementation