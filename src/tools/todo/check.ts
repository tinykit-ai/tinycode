import type { TodoParams } from '../../types/index.js';
import { readTodos, writeTodos, findTodoById } from './utils.js';

export async function check(params: TodoParams, workspaceRoot: string): Promise<string> {
  if (!params.id) {
    return 'Error: ID is required for checking a todo.';
  }

  try {
    const todos = readTodos(workspaceRoot);
    
    const todo = findTodoById(todos, params.id);
    if (!todo) {
      return `Error: Todo with ID '${params.id}' not found.`;
    }
    
    // Toggle the completed status
    todo.completed = !todo.completed;
    
    writeTodos(workspaceRoot, todos);
    
    const status = todo.completed ? 'completed' : 'uncompleted';
    return `Todo '${todo.content}' marked as ${status}.`;
  } catch (error) {
    return `Error checking todo: ${error instanceof Error ? error.message : String(error)}`;
  }
}
