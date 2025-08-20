import type { BaseProtocol } from '../protocols/index.js';
import system from '../system.js';
import type {
    BaseProvider as IBaseProvider,
    Message,
    ProviderSchema,
    ProviderResponse,
    Tool,
    Logger,
    CompressionResult,
    Client,
} from '../types/index.js';

export class BaseProvider implements IBaseProvider {
    public model: string;
    private client: Client;
    private protocol: BaseProtocol;

    constructor(protocol: BaseProtocol, model: string, client: Client) {
        this.model = model;
        this.client = client;
        this.protocol = protocol;
    }

    get maxMessages(): number {
        return 5;
    }

    get schemaKey(): 'anthropicSchema' | 'copilotSchema' {
        return this.protocol.schemaKey;
    }

    async compressMessages(messages: Message[], history: string): Promise<[string, Message[]]> {
        const { messagesToCompress, postCompressionMessages } = this.protocol.getMessagesToCompress(messages);
        if (messagesToCompress.length === 0) {
            return [history, messages];
        }
        const body = this.protocol.createCompressionRequest(messagesToCompress, history, this.model);
        const response = await this.client.chat(body);
        const compressedHistory = this.protocol.parseCompressionResponse(messages, response);
        return [compressedHistory, postCompressionMessages];
    }

    async chat(messages: Message[], tools: ProviderSchema[], history: string): Promise<ProviderResponse> {
        const body = this.protocol.formatBody({ messages, tools, system, history, model: this.model });
        const response = await this.client.chat(body);
        return this.protocol.parseResponse(response);
    }

    async processTools(messages: Message[], tools: Record<string, Tool>, workspaceRoot: string, log: Logger): Promise<Array<Message> | null> {
        return this.protocol.processTools(messages, tools, workspaceRoot, log);
    }

    needsToolProcessing(stopReason: string | null): boolean {
        return this.protocol.needsToolProcessing(stopReason);
    }

    logMessages(messages: Array<Message>, log: Logger): void {
        this.protocol.logMessages(messages, log);
    }
}