import log from '../log.js';
import type { Tool } from '../types/index.js';

export function tools(toolMap: Record<string, Tool>): void {
    log.info('Available tools:');
    Object.values(toolMap).forEach(tool => {
        log.info(`- ${tool.name}`);
    });
}
