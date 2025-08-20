import log from '../../log.js';
import { removeSession, listSessions } from '../../session/index.js';

export function remove(sessionId?: string): void {
    if (!sessionId) {
        log.info('Usage: /remove <sessionId>');
        log.info('Available sessions:');
        const sessions = listSessions();
        sessions.forEach((session, index) => {
            log.info(`${index + 1}. ${session.id.slice(0, 8)} - ${session.title}`);
        });
        return;
    }
    
    // Try full ID first, then try to match by short ID
    let fullId = sessionId;
    if (sessionId.length === 8) {
        const sessions = listSessions();
        const match = sessions.find(s => s.id.startsWith(sessionId));
        if (match) {
            fullId = match.id;
        }
    }
    
    if (removeSession(fullId)) {
        log.info(`Removed session: ${sessionId}`);
    } else {
        log.info(`Session not found: ${sessionId}`);
    }
}
