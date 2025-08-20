import { help } from './help.js';
import { tools } from './tools.js';
import { sessions, newSession, remove, load } from './session/index.js';
import { ToolRegistry } from '../tools/index.js';

export interface CommandResult {
    handled: boolean;
}

export function handleCommand(input: string): CommandResult {
    if (!input.startsWith('/')) return { handled: false };

    const parts = input.slice(1).split(' ');
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    if (!command) return { handled: false };

    switch (command) {
        case 'help':
            help();
            break;
        case 'tools':
            tools(ToolRegistry);
            break;
        case 'sessions':
            sessions();
            break;
        case 'new':
            newSession();
            break;
        case 'load':
            load(args[0]);
            break;
        case 'remove':
            remove(args[0]);
            break;
        default:
            console.log(`Unknown command: ${input}`);
            help();
    }

    return { handled: true };
}
