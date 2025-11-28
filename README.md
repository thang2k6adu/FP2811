# MCP TODO Demo Application

A complete demonstration application showcasing the capabilities of Model Context Protocol (MCP) and MCP-UI through a fully functional TODO management system.

## Overview

This project consists of:
- **MCP Server**: Provides 4 tools for TODO management and a UI resource via MCP protocol
- **MCP-UI Client**: Web interface using `@mcp-ui/client` to render UI resources from the MCP server
- **MCP Proxy**: HTTP bridge between browser client and MCP server (stdio)

## Features

- ✅ **4 MCP Tools**: `todo_create`, `todo_list`, `todo_update`, `todo_delete` with clear JSON schemas
- ✅ **MCP-UI Client**: Clean, minimal UI with buttons tied to MCP tools
- ✅ **LLM Chat Interface**: Built-in GPT-3.5 chat for natural language todo management
- ✅ **Full CRUD Operations**: Add, list, edit, and delete todos through intuitive interface
- ✅ **Priority Levels**: Low, medium, high priority support
- ✅ **Filtering & Search**: Filter by completion status, priority, and search todos
- ✅ **Modern UI**: Beautiful gradient design with smooth animations

## Quick Start

### Prerequisites

- Node.js >= 18.x
- npm or pnpm

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd FP2811
```

2. **Setup MCP Server**:
```bash
cd mcp-server
npm install
npm run build
```

3. **Setup MCP Proxy** (required for browser):
```bash
cd ../mcp-proxy
npm install
npm run build
```

4. **Setup MCP Client**:
```bash
cd ../mcp-client
npm install
```

5. **Configure Environment**:
```bash
cd mcp-client

# Copy example env file
cp .env.example .env

# Edit .env and add your OpenAI API key
# Get API key from: https://platform.openai.com/api-keys
# VITE_OPENAI_API_KEY=sk-your-api-key-here
```

**Note**: The OpenAI API key is required for the LLM chat interface. Without it, the chat will show a warning but the UI will still work.

### Running the Application

You need to run three services in separate terminals:

1. **Start MCP Proxy Server** (Terminal 1):
```bash
cd mcp-proxy
npm start
```
The proxy server will run on `http://localhost:3001` and bridge HTTP requests to the MCP server.

2. **Start UI Client** (Terminal 2):
```bash
cd mcp-client
npm run dev
```
The client will be available at `http://localhost:5173`

3. **Access the application**:
   - Open your browser to `http://localhost:5173`
   - The UI will automatically fetch the UI resource from the MCP server via the proxy
   - You can now add, list, edit, and delete todos through the beautiful interface

**Note**: The MCP server is started automatically by the proxy server when needed. You don't need to run it separately.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MCP-UI CLIENT                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  UIResourceRenderer (@mcp-ui/client)              │  │
│  │  - Fetches UI resource from server                │  │
│  │  - Renders HTML in sandboxed iframe               │  │
│  │  - Handles tool calls via postMessage             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP REST API
┌─────────────────────────▼───────────────────────────────┐
│                  MCP PROXY SERVER                        │
│              (HTTP → stdio bridge)                       │
│  - /api/tools/:toolName                                  │
│  - /api/resources                                        │
│  - /api/resources/:uri                                   │
└─────────────────────────┬───────────────────────────────┘
                          │ MCP Protocol (stdio)
┌─────────────────────────▼───────────────────────────────┐
│                    MCP SERVER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  MCP Tools   │  │ UI Resources │  │   Storage    │ │
│  │  Handlers    │  │ (@mcp-ui/    │  │   Layer      │ │
│  │              │  │  server)     │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## MCP Tools

The server exposes 4 tools:

1. **todo_create**: Create a new TODO item
2. **todo_list**: List TODOs with filtering options
3. **todo_update**: Update an existing TODO
4. **todo_delete**: Delete a TODO

See [API.md](docs/API.md) for detailed API documentation.

## MCP-UI Resources

The server exposes 1 UI resource:

1. **ui://todo/interface**: Interactive TODO management interface

This UI resource is created using `@mcp-ui/server` and contains an HTML interface that:
- Renders in a sandboxed iframe for security
- Communicates with the MCP server via tool calls
- Provides a complete TODO management interface

The client uses `UIResourceRenderer` from `@mcp-ui/client` to render this resource.

## Project Structure

```
FP2811/
├── mcp-server/          # MCP Server implementation
│   ├── src/
│   │   ├── tools/       # MCP tool handlers
│   │   ├── storage/     # Storage layer
│   │   └── types/      # TypeScript types
│   └── dist/           # Compiled output
├── mcp-proxy/          # HTTP Proxy Server (stdio bridge)
│   ├── src/
│   └── dist/          # Compiled output
├── mcp-client/         # React UI client (using @mcp-ui/client)
│   ├── src/
│   │   ├── App.tsx     # Main app with UIResourceRenderer
│   │   └── styles/     # CSS styles
│   └── dist/          # Build output
├── docs/              # Documentation
└── examples/          # Example configurations
```

## Documentation

- [API Documentation](docs/API.md) - Detailed API reference
- [Setup Guide](docs/SETUP.md) - Step-by-step setup instructions
- [Testing Guide](docs/TESTING.md) - How to test the application

## Troubleshooting

### MCP Server not connecting

- Ensure the server is built: `cd mcp-server && npm run build`
- Ensure the proxy server is running: `cd mcp-proxy && npm start`
- Check that proxy server is accessible at `http://localhost:3001`
- Verify Node.js version >= 18

### UI Resource not loading

- Ensure the MCP server is built: `cd mcp-server && npm run build`
- Ensure the proxy server is running: `cd mcp-proxy && npm start`
- Check browser console for errors
- Verify the resource URI `ui://todo/interface` is available
- Check that `@mcp-ui/client` and `@mcp-ui/server` are properly installed

### Build errors

- Run `npm install` in both `mcp-server` and `mcp-client`
- Clear `node_modules` and reinstall if issues persist
- Check TypeScript version compatibility

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Author

thang2k6adu

---

**Status**: Ready for use ✅

## Testing with LLM Client

As mentioned in the requirements, this application is designed to work with LLM clients. The MCP server can be integrated with any MCP-compatible client (like Claude Desktop, Cursor, etc.) to manage todos through natural language.

To test with an LLM client:
1. Configure your LLM client to use this MCP server
2. The server exposes 4 tools that the LLM can call
3. The UI resource provides a visual interface for managing todos

Example LLM interactions:
- "Create a todo to buy groceries with high priority"
- "Show me all incomplete todos"
- "Mark the groceries todo as completed"
- "Delete all completed todos"

