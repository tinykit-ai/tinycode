import kleur from 'kleur';
import type { ToolResult } from './types/index.js';

export interface Logger {
  info: (message: string) => void;
  user: (message: string) => void;
  toolUse: (tool: { name: string; input?: Record<string, any> }) => void;
  assistant: (message: string) => void;
  toolResult: (result: ToolResult) => void;
}

const { yellow, green, grey, white } = kleur;

const toolUse = (tool: { name: string; input?: Record<string, any> }): void => {
	console.log(yellow(`● ToolUse(name: "${tool.name}")`));
	if (tool.input) {
		Object.entries(tool.input).forEach(([key, value], index, array) => {
			const isLast = index === array.length - 1;
			const prefix = isLast ? "  └" : "  ├";
			const display = typeof value === 'string'
				? (value.length > 50 ? value.slice(0, 50) + '...' : value)
				: JSON.stringify(value);
			console.log(yellow(`${prefix} "${key}": ${display}`));
		});
	}
	console.log();
};

const toolResult = (result: ToolResult): void => {
	console.log(green(`✔ ToolResult(name: "${result.name}")`));
	const lines = result.content.split('\n');
	const maxLines = 2;

	lines.slice(0, maxLines).forEach(line => {
		const display = line.length > 80 ? line.slice(0, 80) + '...' : line;
		console.log(green(`  └ ${display}`));
	});

	if (lines.length > maxLines) {
		const hiddenCount = lines.length - maxLines;
		console.log(green(`  ... (${hiddenCount} more)`));
	}
	console.log();
};

const assistant = (message: string): void => {
	console.log(grey().bold(`TinyCode: ${message}`));
	console.log();
};

const user = (message: string): void => {
	console.log(white().bold(`> ${message}`));
	console.log();
};

const info = (message: string): void => {
	console.log(message);
};

const logger: Logger = { toolUse, toolResult, user, assistant, info };

export default logger;