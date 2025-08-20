import type { TodoParams } from '../../types/index.js';
import { readTodos } from './utils.js';

export async function list(params: TodoParams, workspaceRoot: string): Promise<string> {
  try {
    const todos = readTodos(workspaceRoot);
    
    if (todos.length === 0) {
      return 'No todos found.';
    }
    
    const todoList = todos.map(todo => {
      const status = todo.completed ? '✓' : '○';
      const createdDate = new Date(todo.createdAt).toLocaleDateString();
      return `${status} [${todo.id}] ${todo.content} (created: ${createdDate})`;
    }).join('\n');
    
    const completedCount = todos.filter(todo => todo.completed).length;
    const totalCount = todos.length;
    
    return `Todos (${completedCount}/${totalCount} completed):\n${todoList}`;
  } catch (error) {
    return `Error listing todos: ${error instanceof Error ? error.message : String(error)}`;
  }
}
