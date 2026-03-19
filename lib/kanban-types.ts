export type Priority = "높음" | "중간" | "낮음";

export interface Subtask {
  id: string;
  text: string;
  checked: boolean;
}

export interface Card {
  id: string;
  title: string;
  priority?: Priority;
  tags: string[];
  dueDate?: string; // ISO date string "YYYY-MM-DD"
  subtasks: Subtask[];
  columnId: string;
  order: number;
}

export interface Column {
  id: string;
  name: string;
  order: number;
}

export interface Board {
  columns: Column[];
  cards: Card[];
}

export const DEFAULT_COLUMNS: Column[] = [
  { id: "todo", name: "To Do", order: 0 },
  { id: "in-progress", name: "In Progress", order: 1 },
  { id: "done", name: "Done", order: 2 },
];
