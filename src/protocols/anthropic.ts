import { BaseProtocol, ProtocolBody, type ProtocolResponse } from './base.js';
import type {
    Message,
    Tool,
    Logger,
    AssistantMessage,
    MessageContent,
    ToolUseContent,
    ToolResultContent,
} from '../types/index.js';

export class AnthropicProtocol extends BaseProtocol {
    readonly name = 'anthropic';
    readonly schemaKey = 'anthropicSchema' as const;

    formatBody({ messages, tools, system, history, model }: ProtocolBody): string {
        return JSON.stringify({
            anthropic_version: model,
            system: `${system}\n\n Chat history so far:\n${history}`,
            max_tokens: 8192,
            messages,
            ...(tools ? { tools } : {})
        });
    }

    parseResponse(response: any): ProtocolResponse {
        return {
            messages: [{ role: 'assistant', content: response.content }],
            stopReason: response.stop_reason
        };
    }

    needsToolProcessing(stopReason: string | null): boolean {
        return stopReason === 'tool_use';
    }

    async processTools(messages: Message[], tools: Record<string, Tool>, workspaceRoot: string, log: Logger): Promise<Array<Message> | null> {
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || lastMsg.role !== 'assistant') {
            return null;
        }
        const toolInfo = this.getToolInfo(lastMsg);
        if (!toolInfo) return null;

        const { id, name, input } = toolInfo;
        const tool = tools[name];
        const content = tool ? await tool.execute(input, workspaceRoot)
            : `Error: Unknown tool '${name}'`;

        log.toolResult({ name, content });

        return [{
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: id, content } as ToolResultContent]
        }];
    }

    getToolInfo(message: AssistantMessage) {
        if (Array.isArray(message.content)) {
            const toolUse = message.content.find((line): line is ToolUseContent => line.type === 'tool_use');
            if (toolUse) {
                const { id, name, input } = toolUse;
                return { id, name, input };
            }
        }
        return undefined;
    }

    logMessages(messages: Array<Message>, log: Logger): void {
        let lastToolUse: AssistantMessage | undefined = undefined;
        messages.forEach(msg => {
            if (msg.role === 'user') {
                if (typeof msg.content === 'string') {
                    log.user(msg.content);
                } else if (typeof msg.content !== 'string' && msg.content[0]?.type === 'tool_result') {
                    if (lastToolUse) {
                        const toolInfo = this.getToolInfo(lastToolUse);
                        if (!toolInfo) return;
                        log.toolResult({ name: toolInfo.name, content: msg.content[0].content });
                    }
                }
            } else if (msg.role === 'assistant') {
                if (typeof msg.content === 'string') {
                    log.assistant(msg.content);
                } else if (Array.isArray(msg.content)) {
                    msg.content.forEach(line => {
                        if (line.type === 'text') {
                            log.assistant(line.text);
                        } else if (line.type === 'tool_use') {
                            lastToolUse = msg;
                            log.toolUse(line);
                        }
                    });
                }
            }
        });
    }

    findNearestIndex(messages: Message[], type: 'text' | 'tool_result'): number {
        // return the nearest index of a specific type in the messages, relative to the half of the messages
        const halfIndex = Math.floor(messages.length / 2);

        for (let i = halfIndex; i >= 0; i--) {
            const message = messages[i];
            if (!message) continue;

            const isAssistant = message.role === 'assistant';
            const isUser = message.role === 'user';
            const isTextOnly = typeof message.content === 'string' ||
                (Array.isArray(message.content) && message.content.every((line: MessageContent) => line.type === 'text'));
            const isToolResult = Array.isArray(message.content) &&
                message.content.some((line: MessageContent) => line.type === 'tool_result');

            if (type === 'text' && isAssistant && isTextOnly) {
                return i;
            }
            if (type === 'tool_result' && isUser && isToolResult) {
                return i;
            }
        }
        return -1; // No tool result found
    }

    getMessagesToCompress(messages: Message[]) {
        const nearestToolResultIndex = this.findNearestIndex(messages, 'tool_result');
        const nearestAssistantIndex = this.findNearestIndex(messages, 'text');
        const index = Math.max(nearestToolResultIndex, nearestAssistantIndex);

        if (index === -1) {
            return {
                messagesToCompress: [],
                postCompressionMessages: messages
            };
        }
        const messagesToCompress = messages.slice(0, index + 1);
        return {
            messagesToCompress,
            postCompressionMessages: messages.slice(messagesToCompress.length)
        };
    }

    createCompressionRequest(messages: Message[], history: string, model: string): string {
        const content = [
            'Compress the following messages into a single summary, including the chat history so far. ',
            'Even if Chat History is empty, you should still summarize the messages. ',
            'Remove any unnecessary details and keep it concise. ',
            'If you consider any information irrelevant, feel free to omit it. ',
            'Include only the most important points. ',
            'If any information is considered specific/important, please include it as such.',
            'RETURN ONLY THE SUMMARY, DO NOT RETURN ANY OTHER TEXT.',
        ].join('\n');

        return JSON.stringify({
            anthropic_version: model,
            max_tokens: 8192,
            system: `Chat history so far:\n${history}`,
            messages: [
                ...messages,
                { role: 'user' as const, content }
            ]
        });
    }

    parseCompressionResponse(response: any): string {
        return response.content || '';
    }
}