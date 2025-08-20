import log from '../../log.js';
import { listSessions } from '../../session/index.js';

export function sessions(): void {
    const sessions = listSessions();
    
    if (sessions.length === 0) {
        log.info('No sessions found.');
        return;
    }
    
    log.info('Available sessions:');
    sessions.forEach((session, index) => {
        const date = new Date(session.updatedAt).toLocaleDateString();
        log.info(`${index + 1}. ${session.id.slice(0, 8)} - ${session.title} (${date})`);
    });
}
