import type { Logger } from '../log.js';

export interface BaseMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | MessageContent[];
}

export interface UserMessage extends BaseMessage {
  role: 'user';
  content: string | ToolResultContent[];
}

export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  content: string | (TextContent | ToolUseContent)[];
}

export interface SystemMessage extends BaseMessage {
  role: 'system';
  content: string;
}

export interface ToolMessage extends BaseMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
}

export type Message = UserMessage | AssistantMessage | SystemMessage | ToolMessage;

// Message content types
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ToolUseContent {
  id: string;
  name: string;
  type: 'tool_use';
  input: Record<string, any>;
}

export interface ToolResultContent {
  type: 'tool_result';
  content: string;
  tool_use_id: string;
}

export type MessageContent = TextContent | ToolUseContent | ToolResultContent;

// Provider interfaces
export interface ProviderResponse {
  messages: AssistantMessage[];
  stopReason: string | null;
}

export interface CompressionResult {
  history: string;
  messages: Message[];
}

export interface ProviderSchema {
  name: string;
  type?: string;
}

export interface AnthropicToolSchema extends ProviderSchema {
  description?: string;
  input_schema?: {
    type: "object",
    properties: {
      [key: string]: {
        type: string;
        description: string;
        enum?: string[];
      };
    };
    required: string[];
  }
}

export interface OpenAIToolSchema extends ProviderSchema {
  function?: {
    name: string;
    strict?: boolean;
    description: string;
    parameters: Record<string, any>;
  };
}

// Tool interfaces
export interface ToolExecuteParams {
  [key: string]: any;
}

export interface ToolResult {
  name: string;
  content: string;
}

export interface Tool {
  name: string;
  copilotSchema: OpenAIToolSchema;
  anthropicSchema: AnthropicToolSchema
  execute: (params: ToolExecuteParams, workspaceRoot: string) => Promise<string>;
}

// Editor tool specific types
export interface EditorParams extends ToolExecuteParams {
  path: string;
  command: 'view' | 'str_replace' | 'create' | 'insert';
  old_str?: string;
  new_str?: string;
  file_text?: string;
  view_range?: [number, number];
  insert_line?: number;
}

export interface TodoParams extends ToolExecuteParams {
  id?: string;
  command: 'create' | 'check' | 'remove' | 'list';
  content?: string;
}

// Bash tool specific types
export interface BashParams extends ToolExecuteParams {
  command: string;
  restart?: boolean;
}

// Configuration types
export interface Config {
  provider: string;
  maxMessages: number;
  workspaceRoot: string;
}

// Base provider interface
export interface BaseProvider {
  readonly maxMessages: number;
  readonly schemaKey: 'anthropicSchema' | 'copilotSchema';

  chat(messages: Message[], tools: ProviderSchema[], history: string): Promise<ProviderResponse>;
  processTools(messages: Message[], tools: Record<string, Tool>, workspaceRoot: string, log: Logger): Promise<Array<Message> | null>;
  logMessages(newMessages: Array<Message>, log: Logger): void;
  compressMessages(messages: Message[], history: string): Promise<[string, Message[]]>;
  needsToolProcessing(stopReason: string | null): boolean;
}

export interface Client {
  chat: (body: string) => Promise<any>;
}

export {
  Logger
}