import fs from 'fs';
import type { EditorParams } from '../../types/index.js';

export const strReplace = async (params: EditorParams): Promise<string> => {
	try {
		const filePath = params.path;
		if (!fs.existsSync(filePath)) {
			return `Error: File '${filePath}' not found`;
		}

		if (!params.old_str || !params.new_str) {
			return `Error: Both old_str and new_str are required for str_replace command`;
		}

		const content = fs.readFileSync(filePath, 'utf-8');
		const updatedContent = content.replace(params.old_str, params.new_str);
		fs.writeFileSync(filePath, updatedContent, 'utf-8');
		return `Text replaced successfully in '${filePath}'.`;
	} catch (error) {
		console.error('Error replacing string in file:', error);
		return `Error: ${error instanceof Error ? error.message : String(error)}`;
	}
};