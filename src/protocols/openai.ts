import { BaseProtocol, ProtocolBody, type ProtocolResponse } from './base.js';
import type {
    Message, Tool, Logger, AssistantMessage, ToolMessage,
    ToolResult
} from '../types/index.js';

interface ToolCall {
    id: string;
    function: {
        name: string;
        arguments: string;
    };
}

interface OpenAIMessage extends AssistantMessage {
    tool_calls?: ToolCall[];
}

interface OpenAIResponse {
    choices: Array<{
        message: {
            content: string;
            tool_calls?: ToolCall[];
        };
        finish_reason?: string;
    }>;
}

interface ToolInfo {
    id: string;
    name: string;
    input: any;
}


export class OpenAIProtocol extends BaseProtocol {
    readonly name = 'openai';
    readonly schemaKey = 'copilotSchema' as const;

    formatBody({ messages, system, history, model, tools }: ProtocolBody): string {
        return JSON.stringify({
            messages,
            system: `${system}\n\n Chat history so far:\n${history}`,
            max_tokens: 8192,
            model,
            ...(tools ? { tools } : {})
        });
    }

    parseResponse(response: OpenAIResponse): ProtocolResponse {
        const messages: AssistantMessage[] = [];

        response.choices.forEach((choice) => {
            if (choice.message.content) {
                messages.push({
                    "role": "assistant",
                    "content": choice.message.content
                });
            }
            if (choice.message.tool_calls?.length && choice.message.tool_calls.length > 0) {
                messages.push(choice.message as any as AssistantMessage);
            }
        });

        return {
            messages,
            stopReason: response.choices[0]?.finish_reason || null
        };
    }

    needsToolProcessing(stopReason: string | null): boolean {
        return stopReason === 'tool_calls';
    }

    async processTools(messages: Message[], tools: Record<string, Tool>, workspaceRoot: string, log: Logger): Promise<Array<Message> | null> {
        const lastMsg = messages[messages.length - 1] as OpenAIMessage;
        const toolMessages: Array<ToolMessage> = [];
        for (const toolCall of lastMsg.tool_calls || []) {
            const toolInfo = this.getToolInfo(toolCall);

            const { id, name, input } = toolInfo;
            const tool = tools[name];
            log.toolUse({ name, input });
            const content = tool ? await tool.execute(input, workspaceRoot)
                : `Error: Unknown tool '${name}'`;

            log.toolResult({ name, content });
            toolMessages.push({ role: 'tool', tool_call_id: id, content } as ToolMessage);
        }
        return toolMessages;
    }

    getToolInfo(toolCall: ToolCall): ToolInfo {
        const { id, function: toolFunction } = toolCall;
        const { name, arguments: _input } = toolFunction;
        const input = JSON.parse(_input);
        return { id, name, input };
    }

    logMessages(messages: Array<OpenAIMessage | Message>, log: Logger): void {
        this.walkMessages(messages, {
            onUser: (content) => log.user(content),
            onToolUse: (toolInfo) => log.toolUse(toolInfo),
            onToolResult: (toolResult) => log.toolResult(toolResult),
            onAssistant: (content) => log.assistant(content)
        });
    }

    getMessagesToCompress(messages: Message[]) {
        return {
            messagesToCompress: messages,
            postCompressionMessages: [
                { role: 'user', content: 'Chat history compressed. Please check the history and continue with your task. No need to say "Understood".' } as Message
            ]
        }
    }

    createCompressionRequest(messages: Message[], history: string, model: string): string {
        const content = [
            'Compress the following messages into a single summary, including the chat history so far. ',
            'Keep the initial task description intact. ',
            'Even if Chat History is empty, you should still summarize the messages. ',
            'Remove any unnecessary details and keep it concise. ',
            'If you consider any information irrelevant, feel free to omit it. ',
            'Include only the most important points. ',
            'If any information is considered specific/important, please include it as such.',
            'RETURN ONLY THE SUMMARY, DO NOT RETURN ANY OTHER TEXT.',
        ].join('\n');

        return JSON.stringify({
            model,
            max_tokens: 8192,
            system: `Chat history so far:\n${history}`,
            messages: [
                ...messages,
                { role: 'user' as const, content }
            ]
        });
    }

    walkMessages(messages: Array<OpenAIMessage | Message>, options: {
        onUser: (content: string) => void,
        onToolUse: (toolInfo: ToolInfo) => void,
        onToolResult: (toolResult: ToolResult) => void,
        onAssistant: (content: string) => void
    }): void {
        let lastToolUse: ToolCall | undefined;
        messages.forEach(msg => {
            if (msg.role === 'user' && typeof msg.content === 'string') {
                options.onUser(msg.content);
            } else if (msg.role === 'tool' && lastToolUse) {
                const toolInfo = this.getToolInfo(lastToolUse);
                if (!toolInfo) return;
                options.onToolUse(toolInfo);
                options.onToolResult({ name: toolInfo.name, content: msg.content });
            } else if (msg.role === 'assistant') {
                if (typeof msg.content === 'string') {
                    options.onAssistant(msg.content);
                } else if ("tool_calls" in msg && msg.tool_calls.length > 0) {
                    lastToolUse = msg.tool_calls.at(-1);
                }
            }
        });
    }

    parseCompressionResponse(messages: Message[], response: OpenAIResponse): string {
        // provide last 5 messages as context
        const messagesContext: string[] = [];

        this.walkMessages(messages.slice(-5), {
            onUser: (content) => messagesContext.push(`User: ${content}`),
            onToolUse: (toolInfo) => messagesContext.push(`Tool Use: ${toolInfo.name}`),
            onAssistant: (content) => messagesContext.push(`Assistant: ${content}`),
            onToolResult: (toolResult) => messagesContext.push(`Tool Result: ${toolResult.name} - ${toolResult.content}`),
        });

        const history = response.choices[0]?.message.content || '';

        return `${history}\n\nLast 5 Messages:\n${messagesContext.join('\n===========\n')}`;
    }
}