import log from '../../log.js';
import { createNewSession } from '../../session/index.js';

export function newSession() {
    const newSessionId = createNewSession();
    log.info(`Created new session: ${newSessionId.slice(0, 8)}`);
}
