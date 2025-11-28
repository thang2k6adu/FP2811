# MCP TODO Demo Application - Đặc Tả Kỹ Thuật

## 1. Tổng Quan Dự Án

### 1. 1.  Mục Đích
Xây dựng một ứng dụng demo hoàn chỉnh minh họa khả năng của Model Context Protocol (MCP) thông qua một TODO application đơn giản nhưng đầy đủ chức năng.

### 1.2. Phạm Vi
- **MCP Server**: Cung cấp 4 tools xử lý TODO qua MCP protocol
- **MCP-UI Client**: Giao diện web cho phép tương tác với MCP server
- **LLM Integration**: Tích hợp LLM model client để test và tương tác bằng ngôn ngữ tự nhiên
- **Documentation**: Hướng dẫn đầy đủ để setup và chạy ứng dụng

### 1.3. Yêu Cầu Chính Từ Client
> "Build a minimal MCP server exposing four tools: todo_create, todo_list, todo_update, and todo_delete, each with clear JSON schemas. Create a small MCP-UI client where users can add todos, list them, edit them, and delete them through buttons tied to these MCP tools."

> **Hint quan trọng**: "if you don't use a model llm client to test your work, it means you are on the wrong track"

---

## 2. Kiến Trúc Hệ Thống

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

### 3.1.  Công Nghệ
- **Runtime**: Node.js (TypeScript) hoặc Python
- **MCP SDK**: `@modelcontextprotocol/sdk` (Node.js) hoặc `mcp` (Python)
- **Storage**: In-memory hoặc JSON file (để đơn giản)
- **Transport**: stdio (standard input/output)

### 3.2. TODO Data Model

```typescript
interface Todo {
  id: string;           // UUID v4
  title: string;        // Tiêu đề TODO
  description?: string; // Mô tả chi tiết (optional)
  completed: boolean;   // Trạng thái hoàn thành
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
  priority?: 'low' | 'medium' | 'high'; // Độ ưu tiên (optional)
  tags?: string[];      // Tags/labels (optional)
}
```

### 3.3.  MCP Tools Specification

#### 3.3.1. Tool: `todo_create`

**Mô tả**: Tạo một TODO item mới

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Tiêu đề của TODO",
      "minLength": 1,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "description": "Mô tả chi tiết của TODO",
      "maxLength": 1000
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Độ ưu tiên của TODO",
      "default": "medium"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Danh sách tags",
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

**Mô tả**: Lấy danh sách TODOs với khả năng filter

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "completed": {
      "type": "boolean",
      "description": "Filter theo trạng thái hoàn thành"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Filter theo độ ưu tiên"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Filter theo tags"
    },
    "search": {
      "type": "string",
      "description": "Tìm kiếm trong title và description"
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

**Mô tả**: Cập nhật thông tin của một TODO

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID của TODO cần update",
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

**Mô tả**: Xóa một TODO

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID của TODO cần xóa",
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

### 4.1.  Công Nghệ
- **Framework**: React, Vue, hoặc vanilla HTML/CSS/JS
- **MCP Client**: `@modelcontextprotocol/sdk` Client library
- **Styling**: Tailwind CSS hoặc minimal CSS
- **State Management**: React hooks hoặc Vue composition API

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
- Text input cho natural language commands
- Message history display
- Auto-scroll to latest message
- Loading indicator khi đang xử lý

**2. AddTodoForm Component**
- Title input (required)
- Description textarea (optional)
- Priority select dropdown
- Tags input (comma-separated)
- Submit button gọi MCP `todo_create`

**3.  TodoFilters Component**
- Completed checkbox
- Priority dropdown
- Search input
- Sort options
- Filter button gọi MCP `todo_list` với filters

**4. TodoList Component**
- Render danh sách TODOs
- Checkbox để toggle completed
- Edit button mở modal/inline edit
- Delete button với confirmation

**5. TodoItem Component**
- Display title, description, priority, tags
- Checkbox gọi MCP `todo_update` để toggle completed
- Edit button
- Delete button gọi MCP `todo_delete`

**6. EditTodoModal Component**
- Form tương tự AddTodoForm
- Pre-fill data
- Submit button gọi MCP `todo_update`

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

### 4.4. LLM Integration (QUAN TRỌNG!)

**Yêu cầu**: Phải tích hợp LLM model client để test MCP tools

**Implementation Options**:

**Option 1: Claude Desktop Integration**
- Configure MCP server trong Claude Desktop config
- User có thể chat với Claude để tương tác với TODOs
- Example: "Create a todo to buy milk with high priority"

**Option 2: Built-in LLM Client**
- Tích hợp Anthropic API trực tiếp
- Chat interface trong web UI
- LLM sử dụng MCP tools để thực hiện actions

**Option 3: OpenAI Function Calling**
- Sử dụng OpenAI API với function calling
- Map MCP tools thành OpenAI functions
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

## 5. Cấu Trúc Thư Mục Dự Án

```
mcp-todo-demo/
├── README.md                 # Hướng dẫn chính
├── SPECIFICATION.md          # File này
├── LICENSE                   # MIT License
├── . gitignore
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

### 6.1.  Prerequisites
- Node.js >= 18.x
- npm hoặc pnpm
- Claude Desktop (optional, cho LLM testing)

### 6.2.  Installation Steps

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
- Test mỗi MCP tool handler
- Test storage layer
- Test validation logic

### 7.2.  Integration Tests
- Test MCP client-server communication
- Test tool chaining
- Test error handling

### 7.3. LLM Testing (REQUIRED!)
**Phải test với LLM model client**:

**Test Cases**:
1. "Create a todo to buy milk"
   - Expected: LLM calls `todo_create` tool
   
2. "Show me all incomplete todos"
   - Expected: LLM calls `todo_list` với filter completed=false
   
3.  "Mark the milk todo as completed"
   - Expected: LLM calls `todo_list` → finds todo → calls `todo_update`
   
4. "Delete all completed todos"
   - Expected: LLM calls `todo_list` → calls `todo_delete` multiple times

5. "Create 3 todos: buy milk (high priority), finish report (medium), call mom (low)"
   - Expected: LLM calls `todo_create` 3 times

**Testing Tools**:
- Claude Desktop với MCP server configured
- Built-in LLM chat interface trong UI
- MCP Inspector tool

---

## 8. Documentation Requirements

### 8.1. README.md
Phải bao gồm:
- Project overview
- Quick start guide
- Screenshots/GIFs
- Architecture diagram
- Troubleshooting
- Contributing guidelines

### 8.2.  API. md
- Detailed API documentation cho mỗi MCP tool
- Request/response examples
- Error codes và handling

### 8.3. SETUP.md
- Step-by-step setup instructions
- Environment configuration
- Claude Desktop integration
- LLM testing setup

### 8.4.  TESTING.md
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
- Input validation trên server
- Sanitize user inputs
- No injection vulnerabilities

### 9.3.  Code Quality
- TypeScript với strict mode
- ESLint configuration
- Prettier formatting
- Clear comments và documentation

### 9.4.  User Experience
- Clean, minimal UI
- Clear error messages
- Loading states
- Success/error notifications
- Keyboard shortcuts support

---

## 10.  Deliverables

### 10.1. Code
- ✅ MCP Server với 4 tools
- ✅ MCP UI Client với React/Vue
- ✅ LLM Chat interface
- ✅ Storage layer
- ✅ Type definitions
- ✅ Tests

### 10.2. Documentation
- ✅ README.md
- ✅ SPECIFICATION.md (file này)
- ✅ API.md
- ✅ SETUP.md
- ✅ TESTING.md

### 10.3. Configuration
- ✅ package.json files
- ✅ TypeScript configs
- ✅ Claude Desktop config example
- ✅ . env. example

### 10.4. Examples
- ✅ Sample TODO data
- ✅ Test scenarios
- ✅ LLM prompts examples

---

## 11. Success Criteria

✅ **MCP Server**:
- 4 tools hoạt động đúng
- Clear JSON schemas
- Proper error handling
- Documented API

✅ **MCP UI Client**:
- CRUD operations qua UI buttons
- Filters và search working
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

## 12.  Timeline Estimate

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
- MCP SDK có support tốt
- Type safety
- Large ecosystem
- Easy deployment

### 13.2.  Why In-Memory Storage?
- Simplicity
- No database setup needed
- Fast for demo
- Can upgrade to SQLite/PostgreSQL later

### 13. 3. Why React + Vite?
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

Những tính năng có thể thêm sau:
- [ ] Due dates và reminders
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

For questions về specification này:
- Create an issue trong GitHub repo
- Email: your-email@example.com
- Discord: Your Discord handle

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-28  
**Author**: thang2k6adu  
**Status**: Draft → Ready for Implementation