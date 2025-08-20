import fs from 'fs';
import type { EditorParams } from '../../types/index.js';

export const insert = async (params: EditorParams): Promise<string> => {
	try {
		const filePath = params.path;
		if (!fs.existsSync(filePath)) {
			return `Error: File '${filePath}' not found`;
		}

		if (params.insert_line === undefined || !params.new_str) {
			return `Error: Both insert_line and new_str are required for insert command`;
		}

		const content = fs.readFileSync(filePath, 'utf-8');
		const lines = content.split('\n');

		// Insert at specified line
		if (params.insert_line < 0 || params.insert_line > lines.length) {
			return `Error: Invalid insert line ${params.insert_line} for file '${filePath}'`;
		}

		lines.splice(params.insert_line, 0, params.new_str);
		fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
		return `Text inserted successfully at line ${params.insert_line + 1} in '${filePath}'.`;
	} catch (error) {
		console.error('Error inserting text in file:', error);
		return `Error: ${error instanceof Error ? error.message : String(error)}`;
	}
};