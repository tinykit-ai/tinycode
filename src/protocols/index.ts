export { BaseProtocol, type ProtocolResponse } from './base.js';
export { AnthropicProtocol } from './anthropic.js';
export { OpenAIProtocol } from './openai.js';

import { AnthropicProtocol } from './anthropic.js';
import { OpenAIProtocol } from './openai.js';
import type { BaseProtocol } from './base.js';

export type ProtocolName = 'anthropic' | 'openai';
export type ProtocolConstructor = new () => BaseProtocol;
export type ProtocolMap = Record<ProtocolName, ProtocolConstructor>;

export const PROTOCOL_MAP: ProtocolMap = {
    'anthropic': AnthropicProtocol,
    'openai': OpenAIProtocol,
};

export function createProtocol(name: ProtocolName): BaseProtocol {
    const Protocol = PROTOCOL_MAP[name];
    if (!Protocol) {
        throw new Error(`Unknown protocol: ${name}`);
    }
    return new Protocol();
}