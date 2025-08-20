import fs from 'fs';
import path from 'path';

interface AuthTokens {
    access?: string;
    expires?: number;
    refresh?: string;
}

interface AuthStore {
    [provider: string]: AuthTokens;
}

const STORE_PATH = path.join(process.env['HOME'] || process.env['USERPROFILE'] || '.', '.tinycode.json');

let cache: AuthStore | null = null;

function loadStore(): AuthStore {
    if (cache) return cache;
    if (!fs.existsSync(STORE_PATH)) return {};
    try {
        const data = fs.readFileSync(STORE_PATH, 'utf-8');
        cache = JSON.parse(data);
        return cache || {};
    } catch {
        return {};
    }
}

function saveStore(store: AuthStore): void {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), { mode: 0o600 });
    cache = store;
}

export function getAuth(provider: string): AuthTokens | null {
    const store = loadStore();
    return store[provider] || null;
}

export function setAuth(provider: string, tokens: AuthTokens): void {
    const store = loadStore();
    store[provider] = tokens;
    saveStore(store);
}