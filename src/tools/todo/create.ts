import type { TodoParams } from '../../types/index.js';
import { readTodos, writeTodos, generateId, type Todo } from './utils.js';

export async function create(params: TodoParams, workspaceRoot: string): Promise<string> {
  if (!params.content) {
    return 'Error: Content is required for creating a todo.';
  }

  try {
    const todos = readTodos(workspaceRoot);
    
    const newTodo: Todo = {
      id: generateId(),
      content: params.content,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    todos.push(newTodo);
    writeTodos(workspaceRoot, todos);
    
    return `Todo created successfully with ID: ${newTodo.id}`;
  } catch (error) {
    return `Error creating todo: ${error instanceof Error ? error.message : String(error)}`;
  }
}
