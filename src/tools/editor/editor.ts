import path from 'path';
import { withinRoot } from '../withinRoot.js';
import { view } from './view.js';
import { strReplace } from './str_replace.js';
import { create } from './create.js';
import { insert } from './insert.js';
import type { EditorParams, Tool } from '../../types/index.js';

const COMMAND_MAP = {
	'view': view,
	'str_replace': strReplace,
	'create': create,
	'insert': insert,
};

async function execute(params: EditorParams, workspaceRoot: string): Promise<string> {
	try {
		const filePath = path.isAbsolute(params.path)
			? params.path
			: path.resolve(workspaceRoot, params.path);

		// Check if the path is within the root directory
		if (!withinRoot(filePath)) {
			return `Error: The path ${filePath} is outside the root directory.`;
		}

		params.path = filePath; // Ensure the path is absolute for all commands

		const command = params.command;
		if (!COMMAND_MAP[command]) {
			return `Error: Unknown command '${command}'. Available commands are: ${Object.keys(COMMAND_MAP).join(', ')}`;
		}
		return await COMMAND_MAP[command](params);
	} catch (error) {
		return `Error: ${error instanceof Error ? error.message : String(error)}`;
	}
}

const name = 'str_replace_editor';

const editorTool: Tool = {
	name,
	anthropicSchema: {
		name,
		type: 'text_editor_20250124',
	},
	copilotSchema: {
		name,
		type: "function",
		function: {
			name,
			strict: true,
			description: "A comprehensive text editor tool that allows viewing, creating, and modifying text files. Supports precise text replacement, file creation, content insertion, and directory listing. Ideal for code debugging, refactoring, documentation generation, and test creation.",
			parameters: {
				type: "object",
				properties: {
					command: {
						type: "string",
						description: "The editing command to execute",
						enum: ["view", "str_replace", "create", "insert", "undo_edit"]
					},
					path: {
						type: "string",
						description: "The file or directory path to operate on. For view command, can be a file (to read contents) or directory (to list contents). For all other commands, must be a file path."
					},
					view_range: {
						type: "array",
						description: "Optional array of two integers [start_line, end_line] specifying which lines to view. Line numbers are 1-indexed. Use -1 for end_line to read to end of file. Only applicable with 'view' command when viewing files (not directories).",
						items: {
							type: "integer"
						}
					},
					old_str: {
						type: "string",
						description: "The exact text to replace, including all whitespace and indentation. Must match exactly as it appears in the file. Required for 'str_replace' command."
					},
					new_str: {
						type: "string",
						description: "The new text to replace the old_str with, or the text to insert. Required for 'str_replace' and 'insert' commands."
					},
					file_text: {
						type: "string",
						description: "The complete content to write to a new file. Required for 'create' command."
					},
					insert_line: {
						type: "integer",
						description: "The line number after which to insert new text. Use 0 to insert at the beginning of the file. Line numbers are 1-indexed. Required for 'insert' command."
					}
				},
				required: ["command", "path"],
				additionalProperties: false,
			},
		},
	},
	execute: execute as (params: any, workspaceRoot: string) => Promise<string>
};

export { editorTool };