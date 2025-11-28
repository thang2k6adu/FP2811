# MCP TODO Demo Application

A complete demonstration application showcasing the capabilities of Model Context Protocol (MCP) through a fully functional TODO management system.

## Overview

This project consists of:
- **MCP Server**: Provides 4 tools for TODO management via MCP protocol
- **MCP-UI Client**: Web interface for interacting with the MCP server
- **LLM Integration**: Natural language interface using Anthropic's Claude API

## Features

- ✅ Create, read, update, and delete TODOs
- ✅ Filter and search TODOs
- ✅ Priority levels (low, medium, high)
- ✅ Tags support
- ✅ Natural language interaction via LLM chat
- ✅ Modern, responsive UI

## Quick Start

### Prerequisites

- Node.js >= 18.x
- npm or pnpm
- Anthropic API key (for LLM chat feature)

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

5. **Configure Environment** (optional, for LLM chat):
```bash
cd mcp-client

# Option 1: Use OpenAI GPT-3.5 (cheaper, recommended)
echo "VITE_LLM_PROVIDER=openai" > .env
echo "VITE_OPENAI_API_KEY=sk-..." >> .env

# Option 2: Use Claude (more expensive but better quality)
# echo "VITE_LLM_PROVIDER=claude" > .env
# echo "VITE_ANTHROPIC_API_KEY=sk-ant-api03-..." >> .env
```

### Running the Application

1. **Start MCP Server** (in terminal 1):
```bash
cd mcp-server
npm run build  # Build first
npm run dev    # Watch mode (optional)
```

2. **Start MCP Proxy Server** (in terminal 2):
```bash
cd mcp-proxy
npm start
```

3. **Start UI Client** (in terminal 3):
```bash
cd mcp-client
npm run dev
```

4. **Access the application**:
   - Open your browser to `http://localhost:5173`
   - The UI will automatically connect to the MCP proxy server

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MCP-UI CLIENT                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web UI     │  │  LLM Chat    │  │  HTTP Client  │ │
│  │  (Buttons)   │  │  Interface   │  │   (Browser)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP REST API
┌─────────────────────────▼───────────────────────────────┐
│                  MCP PROXY SERVER                        │
│              (HTTP → stdio bridge)                       │
└─────────────────────────┬───────────────────────────────┘
                          │ MCP Protocol (stdio)
┌─────────────────────────▼───────────────────────────────┐
│                    MCP SERVER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  MCP Tools   │  │   Business   │  │   Storage    │ │
│  │  Handlers    │  │    Logic     │  │   Layer      │ │
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

## LLM Chat Interface

The application includes a natural language chat interface. You can use either OpenAI GPT-3.5-turbo (cheaper) or Claude 3.5 Sonnet (better quality). You can interact with your TODOs using natural language:

- "Create a todo to buy milk with high priority"
- "Show me all incomplete todos"
- "Mark the milk todo as completed"
- "Delete all completed todos"

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
├── mcp-client/         # React UI client
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── hooks/      # React hooks
│   │   └── lib/       # HTTP client library
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

### LLM Chat not working

- Ensure API key is set in `mcp-client/.env`:
  - For OpenAI: `VITE_OPENAI_API_KEY=sk-...`
  - For Claude: `VITE_ANTHROPIC_API_KEY=sk-ant-api03-...`
- Set `VITE_LLM_PROVIDER=openai` or `VITE_LLM_PROVIDER=claude`
- Check your API key is valid
- Verify network connectivity

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

