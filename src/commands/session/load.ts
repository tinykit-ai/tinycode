import log from '../../log.js';
import { loadSession, listSessions } from '../../session/index.js';
import { store } from '../../store.js';

const { messages, history, stopReason, sessionId } = store;

export function load(_sessionId?: string): void {
    if (!_sessionId) {
        log.info('Usage: /load <sessionId>');
        log.info('Available sessions:');
        const sessions = listSessions();
        sessions.forEach((session, index) => {
            log.info(`${index + 1}. ${session.id.slice(0, 8)} - ${session.title}`);
        });
        return;
    }

    // Try full ID first, then try to match by short ID
    let fullId = _sessionId;
    if (_sessionId.length === 8) {
        const sessions = listSessions();
        const match = sessions.find(s => s.id.startsWith(_sessionId));
        if (match) {
            fullId = match.id;
        }
    }

    const session = loadSession(fullId);
    if (!session) {
        log.info(`Session not found: ${_sessionId}`);
        return;
    }

    history(session.history);
    messages(session.messages);
    sessionId(session.id);
    stopReason(session.stopReason);

    log.info(`Loaded session: ${session.title}`);
}
