import fs from 'fs';
import path from 'path';
import type { EditorParams } from '../../types/index.js';

export const create = async (params: EditorParams): Promise<string> => {
	try {
		const filePath = params.path;
		
		if (!params.file_text) {
			return `Error: file_text is required for create command`;
		}

		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		fs.writeFileSync(filePath, params.file_text, 'utf-8');
		return `File '${filePath}' created successfully with provided content.`;
	} catch (error) {
		console.error('Error creating file:', error);
		return `Error: ${error instanceof Error ? error.message : String(error)}`;
	}
};