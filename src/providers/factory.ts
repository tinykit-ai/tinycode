import { createProtocol, type ProtocolName } from '../protocols/index.js';
import { BaseProvider } from './base.js';
import { SapClient } from './sap/client.js';
import { CopilotClient } from './copilot/client.js';

// Model to protocol mapping for each provider
const SAP_MODEL_PROTOCOLS: Record<string, ProtocolName> = {
    'bedrock-2023-05-31': 'anthropic',
    'claude-3-sonnet': 'anthropic',
    'claude-3-haiku': 'anthropic',
};

const COPILOT_MODEL_PROTOCOLS: Record<string, ProtocolName> = {
    'claude-sonnet-4': 'openai',
    'gpt-4': 'openai',
    'gpt-4o': 'openai',
};

const PROVIDERS_MAP: Record<string, Record<string, ProtocolName>> = {
    'sap': SAP_MODEL_PROTOCOLS,
    'copilot': COPILOT_MODEL_PROTOCOLS,
};

const DEFAULT_MODELS: Record<string, string> = {
    'sap': 'bedrock-2023-05-31',
    'copilot': 'gpt-4',
};

export function createProvider(providerName: string, model?: string): BaseProvider {
    if (!model) model = DEFAULT_MODELS[providerName] || '';
    const providerProtocols = PROVIDERS_MAP[providerName];
    if (!providerProtocols) {
        throw new Error(`Unknown provider: ${providerName}`);
    }

    const protocolName = providerProtocols[model];
    if (!protocolName) {
        throw new Error(`Unsupported model '${model}' for provider '${providerName}'. Supported models: ${Object.keys(providerProtocols).join(', ')}`);
    }
    const protocol = createProtocol(protocolName);

    switch (providerName) {
        case 'sap':
            return new BaseProvider(protocol, model, new SapClient());
        case 'copilot':
            return new BaseProvider(protocol, model, new CopilotClient());
        default:
            throw new Error(`Unsupported provider: ${providerName}`);
    }
}