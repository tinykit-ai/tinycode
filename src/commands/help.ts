import log from '../log.js';

export function help(): void {
    log.info('Available commands:');
    log.info('/help - Show this help message');
    log.info('/tools - List available tools');
    log.info('/sessions - List all sessions');
    log.info('/new - Create a new session');
    log.info('/load <sessionId> - Load a session');
    log.info('/remove <sessionId> - Remove a session');
}
