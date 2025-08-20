import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Todo {
  id: string;
  content: string;
  completed: boolean;
  createdAt: string;
}

export function getTodoFilePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.tinycode', 'todo.json');
}

export function ensureTodoDirectory(workspaceRoot: string): void {
  const todoDir = path.join(workspaceRoot, '.tinycode');
  if (!fs.existsSync(todoDir)) {
    fs.mkdirSync(todoDir, { recursive: true });
  }
}

export function readTodos(workspaceRoot: string): Todo[] {
  const todoFilePath = getTodoFilePath(workspaceRoot);
  
  if (!fs.existsSync(todoFilePath)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(todoFilePath, 'utf-8');
    return JSON.parse(content) as Todo[];
  } catch (error) {
    console.error('Error reading todos:', error);
    return [];
  }
}

export function writeTodos(workspaceRoot: string, todos: Todo[]): void {
  ensureTodoDirectory(workspaceRoot);
  const todoFilePath = getTodoFilePath(workspaceRoot);
  
  try {
    fs.writeFileSync(todoFilePath, JSON.stringify(todos, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write todos: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function generateId(): string {
  return uuidv4();
}

export function findTodoById(todos: Todo[], id: string): Todo | undefined {
  return todos.find(todo => todo.id === id);
}
