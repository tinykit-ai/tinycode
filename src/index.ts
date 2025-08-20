#!/usr/bin/env node
import 'dotenv/config';
import { q } from './rl.js';
import log from './log.js';
import { ToolRegistry } from './tools/index.js';
import { createProvider } from './providers/factory.js';
import { handleCommand } from './commands/index.js';
import { saveSession, ensureSession } from './session/index.js';
import { store } from './store.js'

const WORKSPACE_ROOT = process.cwd();
const PROVIDER_NAME = process.env.TINYCODE_PROVIDER || 'copilot';
const MODEL = process.env.TINYCODE_MODEL;

const provider = createProvider(PROVIDER_NAME, MODEL);
const tools = Object.values(ToolRegistry).map(tool => tool[provider.schemaKey]);

const { messages, history, stopReason, sessionId } = store;

let _messages = messages();
let _history = history();
let _stopReason = stopReason();

const userPrompt = async (): Promise<string> => {
    const content = await q('> ');
    console.log(); // Add a newline for better readability

    const commandResult = handleCommand(content, ToolRegistry);
    if (commandResult.handled) {
        return "";
    }

    return content;
};

// Try to load the last session
ensureSession();

log.info(`Ready! Using provider: ${PROVIDER_NAME}`);
log.info(`Model: ${MODEL || provider.model}`);

provider.logMessages(_messages, log);

async function main(): Promise<void> {
    while (true) {
        _messages = messages();
        _history = history();
        _stopReason = stopReason();
        try {
            // Process tool calls or get user input
            if (provider.needsToolProcessing(_stopReason)) {
                const toolMessages = await provider.processTools(_messages, ToolRegistry, WORKSPACE_ROOT, log);
                if (toolMessages) _messages.push(...toolMessages);
            } else {
                const content = await userPrompt();
                if (content) {
                    _messages.push({ role: 'user', content });
                }
            }

            // Compress messages if needed
            if (_messages.length >= provider.maxMessages) {
                const result = await provider.compressMessages(_messages, _history);
                _history = result.history;
                _messages = result.messages;
            }

            // Get AI response
            const response = await provider.chat(_messages, tools, _history);
            provider.logMessages(response.messages, log);

            _messages.push(...response.messages);
            _stopReason = response.stopReason;
        } catch (error) {
            console.error('Error occurred while processing:', error);
            console.error('Last two messages:', _messages.slice(-2));
            await userPrompt();
        } finally {
            messages(_messages);
            history(_history);
            stopReason(_stopReason);
            saveSession(sessionId(), messages(), history(), stopReason(), PROVIDER_NAME, MODEL);
        }
    }
}

main().catch(error => {
    log.info(`Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error('An error occurred:', error);
});
