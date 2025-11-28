# Setup Guide

This guide will walk you through setting up the MCP TODO Demo Application.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 18.x installed
- **npm** or **pnpm** package manager
- **Anthropic API key** (optional, for LLM chat feature)

### Checking Node.js Version

```bash
node --version
```

If you don't have Node.js 18+, install it from [nodejs.org](https://nodejs.org/).

## Step 1: Clone and Navigate

```bash
git clone <repository-url>
cd FP2811
```

## Step 2: Setup MCP Server

1. Navigate to the server directory:
```bash
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

4. Verify the build:
```bash
ls dist/
```

You should see `index.js` and other compiled files.

## Step 3: Setup MCP Client

1. Navigate to the client directory:
```bash
cd ../mcp-client
```

2. Install dependencies:
```bash
npm install
```

3. Configure the server path (if needed):
   - Open `src/hooks/useMCPClient.ts`
   - Update `SERVER_PATH` to match your absolute path to the compiled server

## Step 4: Configure LLM (Optional)

If you want to use the LLM chat interface:

1. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)

2. Create a `.env` file in `mcp-client/`:
```bash
cd mcp-client
echo "VITE_ANTHROPIC_API_KEY=your-api-key-here" > .env
```

3. Replace `your-api-key-here` with your actual API key

## Step 5: Run the Application

### Terminal 1: Start MCP Server

```bash
cd mcp-server
npm run dev
```

The server will run in watch mode, automatically rebuilding on changes.

### Terminal 2: Start UI Client

```bash
cd mcp-client
npm run dev
```

The client will start on `http://localhost:5173`

## Step 6: Access the Application

1. Open your browser
2. Navigate to `http://localhost:5173`
3. The UI should automatically connect to the MCP server

## Verification

### Check Server Connection

- The UI should show "Connecting to MCP server..." briefly
- If connected, you should see the TODO interface
- If there's an error, check the browser console

### Test Basic Functionality

1. **Create a TODO**:
   - Fill in the "Add New TODO" form
   - Click "Add TODO"
   - The TODO should appear in the list

2. **Filter TODOs**:
   - Use the filters section
   - Apply filters and verify results

3. **Edit a TODO**:
   - Click "Edit" on any TODO
   - Make changes and save
   - Verify the changes

4. **Delete a TODO**:
   - Click "Delete" on any TODO
   - Confirm deletion
   - Verify it's removed

### Test LLM Chat (if configured)

1. Type a message like: "Create a todo to buy milk"
2. The LLM should create a TODO
3. Try: "Show me all incomplete todos"
4. Verify the response

## Troubleshooting

### Server Won't Start

**Error**: `Cannot find module '@modelcontextprotocol/sdk'`

**Solution**:
```bash
cd mcp-server
rm -rf node_modules
npm install
```

### Client Won't Connect

**Error**: Connection timeout or "Failed to connect"

**Solutions**:
1. Verify server is running: `ps aux | grep node`
2. Check server path in `useMCPClient.ts`
3. Ensure server is built: `cd mcp-server && npm run build`
4. Check browser console for detailed errors

### Build Errors

**Error**: TypeScript compilation errors

**Solutions**:
1. Check Node.js version: `node --version` (should be >= 18)
2. Clear and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Check TypeScript version compatibility

### LLM Chat Not Working

**Error**: "VITE_ANTHROPIC_API_KEY is not set"

**Solutions**:
1. Create `.env` file in `mcp-client/`
2. Add: `VITE_ANTHROPIC_API_KEY=your-key`
3. Restart the dev server
4. Verify API key is valid

### Port Already in Use

**Error**: Port 5173 already in use

**Solution**: Change port in `vite.config.ts`:
```typescript
server: {
  port: 3000, // or any available port
}
```

## Development Mode

### Watch Mode

Both server and client support watch mode:

- **Server**: `npm run dev` (rebuilds on file changes)
- **Client**: `npm run dev` (hot reloads on file changes)

### Production Build

**Server**:
```bash
cd mcp-server
npm run build
```

**Client**:
```bash
cd mcp-client
npm run build
```

Built files will be in `dist/` directories.

## Next Steps

- Read [API.md](API.md) for API documentation
- Check [TESTING.md](TESTING.md) for testing guidelines
- Explore the codebase to understand the architecture

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console and server logs
3. Verify all prerequisites are met
4. Check Node.js and npm versions

---

**Setup Complete!** 🎉

You should now have a working MCP TODO application.

