import { SessionManager } from './SessionManager.js';

// Singleton pattern for SessionManager to ensure consistent state across routes
let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

export default getSessionManager;