import type { TodoParams } from '../../types/index.js';
import { readTodos, writeTodos } from './utils.js';

export async function remove(params: TodoParams, workspaceRoot: string): Promise<string> {
  if (!params.id) {
    return 'Error: ID is required for removing a todo.';
  }

  try {
    const todos = readTodos(workspaceRoot);
    
    const todoIndex = todos.findIndex(todo => todo.id === params.id);
    if (todoIndex === -1) {
      return `Error: Todo with ID '${params.id}' not found.`;
    }
    
    const removedTodo = todos[todoIndex];
    todos.splice(todoIndex, 1);
    
    writeTodos(workspaceRoot, todos);
    
    return `Todo '${removedTodo!.content}' removed successfully.`;
  } catch (error) {
    return `Error removing todo: ${error instanceof Error ? error.message : String(error)}`;
  }
}
