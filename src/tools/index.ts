import { Tool } from '../types/index.js';
import { bashTool } from './bash/bash.js';
import { editorTool } from './editor/editor.js';
import { todoTool } from './todo/todo.js';

const ToolRegistry: Record<string, Tool> = {
    [bashTool.name]: bashTool,
    [editorTool.name]: editorTool,
    [todoTool.name]: todoTool,
};

export { ToolRegistry, bashTool, editorTool, todoTool };