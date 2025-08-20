import { create } from './create.js';
import { check } from './check.js';
import { remove } from './remove.js';
import { list } from './list.js';
import type { TodoParams, Tool } from '../../types/index.js';

const COMMAND_MAP = {
    'create': create,
    'check': check,
    'remove': remove,
    'list': list
};

async function execute(params: TodoParams, workspaceRoot: string): Promise<string> {
    try {
        if (!params.command) return `Error: No command specified.`;
        if (!COMMAND_MAP[params.command]) {
            return `Error: Unknown command '${params.command}'. Available commands are: ${Object.keys(COMMAND_MAP).join(', ')}`;
        }
        return await COMMAND_MAP[params.command](params, workspaceRoot);
    } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
}

const name = 'todo';
const description = 'A tool for managing TODO items. You can create, check, remove, and list todos.';

const parameters = {
    type: "object",
    properties: {
        command: {
            type: "string",
            description: "The editing command to execute",
            enum: ["create", "check", "remove", "list"]
        },
        id: {
            type: "string",
            description: "The TODO ID to operate on. Not required for list command."
        },
        content: {
            type: "string",
            description: "The content to create or modify. Required for create and modify commands."
        }
    },
    required: ["command"]
};

const todoTool: Tool = {
    name,
    anthropicSchema: {
        name,
        description,
        input_schema: {
            type: "object",
            properties: parameters.properties,
            required: parameters.required,
        }
    },
    copilotSchema: {
        name,
        type: "function",
        function: {
            name,
            strict: true,
            description,
            parameters: {
                type: "object",
                properties: {
                    command: {
                        type: "string",
                        description: "The editing command to execute",
                        enum: ["create", "check", "remove", "list"]
                    },
                    id: {
                        type: "string",
                        description: "The TODO ID to operate on. Not required for list command."
                    },
                    content: {
                        type: "string",
                        description: "The content to create or modify. Required for create and modify commands."
                    }
                },
                required: ["command"],
                additionalProperties: false,
            },
        },
    },
    execute: execute as (params: any, workspaceRoot: string) => Promise<string>
};

export { todoTool };
