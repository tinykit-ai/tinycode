import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Message } from '../types/index.js';
import { store } from '../store.js';

const { sessionId, messages, history, stopReason } = store;

export interface SessionData {
    id: string;
    title: string;
    messages: Message[];
    history: string;
    stopReason: string | null;
    provider: string;
    model: string | undefined;
    createdAt: string;
    updatedAt: string;
}

const SESSIONS_DIR = '.tinycode/sessions';

function ensureSessionsDir(): void {
    if (!fs.existsSync(SESSIONS_DIR)) {
        fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
}

function getSessionTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage || typeof firstUserMessage.content !== 'string') {
        return 'New session...';
    }

    const words = firstUserMessage.content.trim().split(/\s+/).slice(0, 4);
    return words.join(' ') + '...';
}

export function saveSession(
    id: string,
    messages: Message[],
    history: string,
    stopReason: string | null,
    provider: string,
    model: string | undefined
): void {
    ensureSessionsDir();

    const sessionFile = path.join(SESSIONS_DIR, `${id}.json`);
    const now = new Date().toISOString();

    let existing = {  createdAt: now };
    if (fs.existsSync(sessionFile)) {
        existing = JSON.parse(fs.readFileSync(sessionFile, 'utf8')) as SessionData;
    }

    const sessionData: SessionData = {
        ...existing,
        id,
        title: getSessionTitle(messages),
        messages,
        history,
        stopReason,
        provider,
        model,
        updatedAt: now
    };

    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
}

export function loadSession(id: string): SessionData | null {
    ensureSessionsDir();
    const sessionFile = path.join(SESSIONS_DIR, `${id}.json`);

    if (!fs.existsSync(sessionFile)) {
        return null;
    }

    return JSON.parse(fs.readFileSync(sessionFile, 'utf8')) as SessionData;
}

export function listSessions(): SessionData[] {
    ensureSessionsDir();

    if (!fs.existsSync(SESSIONS_DIR)) {
        return [];
    }

    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
    const sessions: SessionData[] = [];

    for (const file of files) {
        try {
            const sessionData = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf8')) as SessionData;
            sessions.push(sessionData);
        } catch {
            // Skip invalid session files
        }
    }

    return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function removeSession(id: string): boolean {
    ensureSessionsDir();
    const sessionFile = path.join(SESSIONS_DIR, `${id}.json`);

    if (!fs.existsSync(sessionFile)) {
        return false;
    }

    fs.unlinkSync(sessionFile);
    return true;
}

export function createNewSession(): string {
    const newSessionId = randomUUID();
    sessionId(newSessionId);
    messages([]);
    history('');
    stopReason(null);
    return newSessionId;
}

export function loadLastSession(): SessionData | null {
    const sessions = listSessions();
    const lastSession = sessions[0] || null;
    if (!lastSession) {
        return null;
    }
    sessionId(lastSession.id);
    messages(lastSession.messages);
    history(lastSession.history);
    stopReason(lastSession.stopReason);
    return lastSession;
}

export function ensureSession(): void {
    const lastSession = loadLastSession();
    if (!lastSession) {
        createNewSession();
    }
}