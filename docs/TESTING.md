# Testing Guide

This guide covers how to test the MCP TODO Demo Application.

## Testing Overview

The application can be tested in multiple ways:
1. **Manual UI Testing**: Using the web interface
2. **LLM Testing**: Using natural language commands
3. **MCP Protocol Testing**: Direct MCP tool calls

## Prerequisites

- Application is running (see [SETUP.md](SETUP.md))
- Browser with developer tools
- (Optional) Anthropic API key for LLM testing

## Manual UI Testing

### Test Case 1: Create TODO

**Steps**:
1. Open the application in browser
2. Fill in "Add New TODO" form:
   - Title: "Test TODO"
   - Description: "This is a test"
   - Priority: "High"
   - Tags: "test, demo"
3. Click "Add TODO"

**Expected Result**:
- TODO appears in the list
- All fields are correctly displayed
- No error messages

### Test Case 2: List and Filter TODOs

**Steps**:
1. Create multiple TODOs with different priorities
2. Use filters:
   - Check "Incomplete"
   - Select "High" priority
   - Click "Apply Filters"

**Expected Result**:
- Only incomplete, high-priority TODOs are shown
- Filter count is correct

### Test Case 3: Update TODO

**Steps**:
1. Click "Edit" on any TODO
2. Modify title, description, or priority
3. Toggle completed status
4. Click "Save"

**Expected Result**:
- Changes are saved
- TODO is updated in the list
- Updated timestamp changes

### Test Case 4: Delete TODO

**Steps**:
1. Click "Delete" on a TODO
2. Confirm deletion

**Expected Result**:
- TODO is removed from the list
- No error messages

### Test Case 5: Toggle Completion

**Steps**:
1. Click checkbox on a TODO
2. Verify status changes

**Expected Result**:
- TODO is marked as completed/incomplete
- Visual styling updates (opacity change)

## LLM Testing (Natural Language)

### Prerequisites

- LLM chat interface configured with API key
- Server and client running

### Test Case 1: Create TODO via LLM

**Command**: "Create a todo to buy milk with high priority"

**Expected**:
- LLM calls `todo_create` tool
- TODO is created with:
  - Title: "buy milk" (or similar)
  - Priority: "high"
- Response confirms creation

### Test Case 2: List TODOs via LLM

**Command**: "Show me all incomplete todos"

**Expected**:
- LLM calls `todo_list` with `completed: false`
- Response shows list of incomplete TODOs
- LLM formats response nicely

### Test Case 3: Update TODO via LLM

**Command**: "Mark the milk todo as completed"

**Expected**:
- LLM calls `todo_list` to find the todo
- LLM calls `todo_update` with `completed: true`
- TODO is marked as completed
- Response confirms update

### Test Case 4: Delete TODO via LLM

**Command**: "Delete all completed todos"

**Expected**:
- LLM calls `todo_list` with `completed: true`
- LLM calls `todo_delete` for each completed todo
- All completed TODOs are deleted
- Response confirms deletion

### Test Case 5: Complex Command

**Command**: "Create 3 todos: buy milk (high priority), finish report (medium), call mom (low)"

**Expected**:
- LLM calls `todo_create` 3 times
- All 3 TODOs are created with correct priorities
- Response confirms all creations

## MCP Protocol Testing

### Using MCP Inspector (if available)

1. Connect MCP Inspector to the server
2. Test each tool individually
3. Verify request/response format

### Manual Tool Testing

You can test tools directly using the MCP client library:

```typescript
import { MCPTodoClient } from './lib/mcp-client.js';

const client = new MCPTodoClient();
await client.connect('/path/to/server');

// Test create
const createResult = await client.createTodo({
  title: 'Test',
  priority: 'high'
});
console.log(createResult);

// Test list
const listResult = await client.listTodos({ completed: false });
console.log(listResult);

// Test update
const updateResult = await client.updateTodo({
  id: 'todo-id',
  completed: true
});
console.log(updateResult);

// Test delete
const deleteResult = await client.deleteTodo('todo-id');
console.log(deleteResult);
```

## Error Testing

### Test Case: Invalid Input

**Steps**:
1. Try to create TODO with empty title
2. Try to update non-existent TODO
3. Try to delete non-existent TODO

**Expected**:
- Appropriate error messages
- No crashes
- UI handles errors gracefully

### Test Case: Network Issues

**Steps**:
1. Stop MCP server
2. Try to perform operations

**Expected**:
- Connection error displayed
- UI shows appropriate message
- No JavaScript errors

## Performance Testing

### Test Case: Large Dataset

**Steps**:
1. Create 100+ TODOs
2. Apply filters
3. Search functionality

**Expected**:
- No performance degradation
- UI remains responsive
- Operations complete in < 1 second

## Browser Compatibility

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Checklist

- [ ] Create TODO works
- [ ] List TODOs works
- [ ] Filter TODOs works
- [ ] Update TODO works
- [ ] Delete TODO works
- [ ] Toggle completion works
- [ ] LLM chat creates TODO
- [ ] LLM chat lists TODOs
- [ ] LLM chat updates TODO
- [ ] LLM chat deletes TODO
- [ ] Error handling works
- [ ] UI is responsive
- [ ] No console errors
- [ ] All features accessible

## Debugging Tips

### Browser Console

Open DevTools (F12) and check:
- Console for errors
- Network tab for MCP communication
- React DevTools for component state

### Server Logs

Check terminal running the server for:
- Connection logs
- Error messages
- Tool execution logs

### Common Issues

1. **CORS errors**: Not applicable (stdio transport)
2. **Connection timeouts**: Check server path
3. **Type errors**: Verify TypeScript compilation
4. **LLM errors**: Check API key and network

## Automated Testing (Future)

Consider adding:
- Unit tests for storage layer
- Integration tests for MCP tools
- E2E tests for UI
- LLM interaction tests

## Reporting Issues

When reporting issues, include:
1. Test case that failed
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser and OS version
5. Console errors (if any)
6. Server logs (if relevant)

---

**Happy Testing!** 🧪

