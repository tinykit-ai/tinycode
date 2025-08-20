import fs from 'fs';
import type { EditorParams } from '../../types/index.js';

export const view = async (params: EditorParams): Promise<string> => {
	try {
		const filePath = params.path;
		if (!fs.existsSync(filePath)) {
			return `Error: File or directory '${params.path}' not found`;
		}

		const stats = fs.statSync(filePath);
		if (stats.isDirectory()) {
			// List files in directory
			const files = fs.readdirSync(filePath);
			return `Contents of directory '${params.path}':\n${files.join('\n')}`;
		} else {
			// Read file contents
			const content = fs.readFileSync(filePath, 'utf-8');

			if (params.view_range) {
				const [start, end] = params.view_range;
				const lines = content.split('\n');
				const startLine = start > 0 ? start - 1 : 0; // Convert to 0-indexed
				const endLine = end > 0 ? end - 1 : lines.length - 1; // Convert to 0-indexed
				const selectedLines = lines.slice(startLine, endLine + 1);
				return `Contents of file '${params.path}' from line ${start} to ${end}:\n${selectedLines.join('\n')}`;
			}

			return `Contents of file '${params.path}':\n${content}`;
		}
	} catch (error) {
		console.error('Error viewing file or directory:', error);
		return `Error: ${error instanceof Error ? error.message : String(error)}`;
	}
};