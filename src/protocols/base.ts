import type { Message, ProviderSchema, Tool, Logger, AssistantMessage, ToolMessage } from '../types/index.js';

export interface ProtocolBody {
    messages: Message[];
    tools?: ProviderSchema[];
    system: string;
    history: string;
    model: string;
}

export interface ProtocolResponse {
    messages: AssistantMessage[];
    stopReason: string | null;
}

export interface CompressionResult {
    messagesToCompress: Message[];
    postCompressionMessages: Message[];
}

export abstract class BaseProtocol {
    abstract readonly name: string;
    abstract readonly schemaKey: 'anthropicSchema' | 'copilotSchema';
    abstract formatBody(body: ProtocolBody): string;
    abstract parseResponse(response: any): ProtocolResponse;
    abstract needsToolProcessing(stopReason: string | null): boolean;
    abstract processTools(messages: Message[], tools: Record<string, Tool>, workspaceRoot: string, log: Logger): Promise<Array<Message> | null>;
    abstract logMessages(messages: Array<Message>, log: Logger): void;
    abstract createCompressionRequest(messages: Message[], history: string, models: string): string;
    abstract getMessagesToCompress(messages: Message[]): CompressionResult;
    abstract parseCompressionResponse(messages: Message[], response: any): string;
}