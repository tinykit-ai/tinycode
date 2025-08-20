#!/usr/bin/env node
import 'dotenv/config';
import log from './log.js';
import { store } from './store.js'
import { userPrompt } from './rl.js';
import { ToolRegistry } from './tools/index.js';
import { createProvider } from './providers/factory.js';
import { handleCommand as onCommand } from './commands/index.js';
import { saveSession, ensureSession } from './session/index.js';
import { Message } from './types/index.js';

const MODEL = process.env.TINYCODE_MODEL;
const PROVIDER_NAME = process.env.TINYCODE_PROVIDER || 'copilot';
const WORKSPACE_ROOT = process.cwd();

const provider = createProvider(PROVIDER_NAME, MODEL);
const tools = Object.values(ToolRegistry).map(tool => tool[provider.schemaKey]);

const { messages, history, stopReason, sessionId } = store;

// Try to load the last session
ensureSession();

let _history = history();
let _messages = messages();
let _stopReason = stopReason();

log.info(`Ready!`);
log.info(`Provider: ${PROVIDER_NAME}`);
log.info(`Model: ${MODEL || provider.model}`);

async function main(): Promise<void> {
    provider.logMessages(_messages, log);
    while (true) {
        try {
            // Process tool calls or get user input
            if (provider.needsToolProcessing(_stopReason)) {
                const toolMessages = await provider.processTools(_messages, ToolRegistry, WORKSPACE_ROOT, log);
                if (toolMessages) _messages.push(...toolMessages);
            } else {
                const content = await userPrompt({ onCommand });
                if (content) {
                    _messages.push({ role: 'user', content });
                } else {
                    continue; // Skip if no content was provided
                }
            }

            // Compress messages if needed
            if (_messages.length >= provider.maxMessages) {
                [_history, _messages] = await provider.compressMessages(_messages, _history);
            }

            // Get AI response
            const response = await provider.chat(_messages, tools, _history);
            provider.logMessages(response.messages, log);

            _messages.push(...response.messages);
            _stopReason = response.stopReason;
        } catch (error) {
            console.error('Error occurred while processing:', error);
            console.error('Last two messages:', _messages.slice(-2));
            await userPrompt({ onCommand });
        } finally {
            history(_history);
            messages(_messages);
            stopReason(_stopReason);
            saveSession(sessionId(), messages(), history(), stopReason(), PROVIDER_NAME, MODEL);
        }
    }
}

main().catch(error => {
    log.info(`Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error('An error occurred:', error);
});
