// Generate a session ID once and reuse it for all requests in this browser session
let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    // Try to get from localStorage first (persist across page refreshes)
    const stored = localStorage.getItem('mcp-session-id');
    if (stored) {
      sessionId = stored;
    } else {
      // Generate new session ID
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('mcp-session-id', sessionId);
    }
  }
  return sessionId;
}

