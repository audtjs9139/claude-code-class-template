import { Board, DEFAULT_COLUMNS } from "./kanban-types";

const STORAGE_KEY = "kanban-board-v1";

export function loadBoard(): Board {
  if (typeof window === "undefined") {
    return { columns: DEFAULT_COLUMNS, cards: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { columns: DEFAULT_COLUMNS, cards: [] };
    const parsed = JSON.parse(raw) as Board;
    return parsed;
  } catch {
    return { columns: DEFAULT_COLUMNS, cards: [] };
  }
}

export function saveBoard(board: Board): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
}
