import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, afterEach } from "vitest";
import KanbanPage from "./kanban/page";

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

beforeEach(() => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
  localStorageMock.clear();
  // Mock today as 2026-03-19
  vi.setSystemTime(new Date("2026-03-19"));
});

afterEach(() => {
  vi.useRealTimers();
});

// Helper: render kanban page
function renderKanban(initialData?: object) {
  if (initialData) {
    localStorageMock.setItem("kanban-board-v1", JSON.stringify(initialData));
  }
  return render(<KanbanPage />);
}

// Helper: get column element by name
function getColumn(name: string) {
  return screen.getByRole("region", { name });
}

// ──────────────────────────────────────────────
// KANBAN-001: 카드 추가
// ──────────────────────────────────────────────
describe("KANBAN-001: 카드 추가", () => {
  it("example 1: + 버튼 클릭 → 제목 Input 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban();
    const todoColumn = getColumn("To Do");
    const addButton = within(todoColumn).getByRole("button", { name: /추가|add|\+/i });
    await user.click(addButton);
    expect(within(todoColumn).getByRole("textbox", { name: /제목/i })).toBeInTheDocument();
  });

  it("example 2: 제목 입력 후 확인 → 카드 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban();
    const todoColumn = getColumn("To Do");
    const addButton = within(todoColumn).getByRole("button", { name: /추가|add|\+/i });
    await user.click(addButton);
    const input = within(todoColumn).getByRole("textbox", { name: /제목/i });
    await user.type(input, "우유 사기");
    const confirmButton = within(todoColumn).getByRole("button", { name: /확인/i });
    await user.click(confirmButton);
    expect(within(todoColumn).getByText("우유 사기")).toBeInTheDocument();
  });

  it("example 3: 빈 제목 확인 → 에러 메시지", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban();
    const todoColumn = getColumn("To Do");
    const addButton = within(todoColumn).getByRole("button", { name: /추가|add|\+/i });
    await user.click(addButton);
    const confirmButton = within(todoColumn).getByRole("button", { name: /확인/i });
    await user.click(confirmButton);
    expect(screen.getByText("제목을 입력해주세요")).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────
// KANBAN-002: 카드 인라인 편집
// ──────────────────────────────────────────────
describe("KANBAN-002: 카드 인라인 편집", () => {
  const initialBoard = {
    columns: [
      { id: "todo", name: "To Do", order: 0 },
      { id: "in-progress", name: "In Progress", order: 1 },
      { id: "done", name: "Done", order: 2 },
    ],
    cards: [
      { id: "c1", title: "우유 사기", priority: undefined, tags: [], dueDate: undefined, subtasks: [], columnId: "todo", order: 0 },
    ],
  };

  it("example 1: 카드 클릭 → 상세 다이얼로그 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByDisplayValue("우유 사기")).toBeInTheDocument();
  });

  it("example 2: 제목 변경 후 저장 → 카드 제목 업데이트", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => screen.getByRole("dialog"));
    const titleInput = screen.getByRole("textbox", { name: /제목/i });
    await user.clear(titleInput);
    await user.type(titleInput, "빵 사기");
    await user.click(screen.getByRole("button", { name: /저장|save/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("빵 사기")).toBeInTheDocument();
  });

  it("example 3: 우선순위 변경 → 배지 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => screen.getByRole("dialog"));
    const prioritySelect = screen.getByRole("combobox", { name: /우선순위/i });
    await user.click(prioritySelect);
    await user.click(screen.getByRole("option", { name: "높음" }));
    await user.click(screen.getByRole("button", { name: /저장|save/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("높음")).toBeInTheDocument();
  });

  it("example 4: 태그 추가 → 배지 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => screen.getByRole("dialog"));
    const tagInput = screen.getByRole("textbox", { name: /태그/i });
    await user.type(tagInput, "장보기{Enter}");
    await user.click(screen.getByRole("button", { name: /저장|save/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("장보기")).toBeInTheDocument();
  });

  it("example 5: 마감일 설정 → 마감일 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => screen.getByRole("dialog"));
    const dateInput = screen.getByLabelText(/마감일/i);
    fireEvent.change(dateInput, { target: { value: "2026-03-25" } });
    await user.click(screen.getByRole("button", { name: /저장|save/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("2026-03-25")).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────
// KANBAN-003: 카드 삭제
// ──────────────────────────────────────────────
describe("KANBAN-003: 카드 삭제", () => {
  const initialBoard = {
    columns: [
      { id: "todo", name: "To Do", order: 0 },
      { id: "in-progress", name: "In Progress", order: 1 },
      { id: "done", name: "Done", order: 2 },
    ],
    cards: [
      { id: "c1", title: "우유 사기", priority: undefined, tags: [], dueDate: undefined, subtasks: [], columnId: "todo", order: 0 },
    ],
  };

  it("example 1: 삭제 확인 → 카드 삭제", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => screen.getByRole("dialog"));
    await user.click(screen.getByRole("button", { name: /삭제|delete/i }));
    await waitFor(() => expect(screen.getByText("정말 삭제하시겠습니까?")).toBeInTheDocument());
    const confirmBtn = screen.getByRole("button", { name: /확인|confirm/i });
    await user.click(confirmBtn);
    await waitFor(() => expect(screen.queryByText("우유 사기")).not.toBeInTheDocument());
  });

  it("example 2: 삭제 취소 → 카드 유지", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => screen.getByRole("dialog"));
    await user.click(screen.getByRole("button", { name: /삭제|delete/i }));
    await waitFor(() => expect(screen.getByText("정말 삭제하시겠습니까?")).toBeInTheDocument());
    const cancelBtn = screen.getByRole("button", { name: /취소|cancel/i });
    await user.click(cancelBtn);
    expect(screen.getByText("우유 사기")).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────
// KANBAN-004: 드래그&드롭 이동
// ──────────────────────────────────────────────
describe("KANBAN-004: 카드 드래그&드롭 이동", () => {
  const initialBoard = {
    columns: [
      { id: "todo", name: "To Do", order: 0 },
      { id: "in-progress", name: "In Progress", order: 1 },
      { id: "done", name: "Done", order: 2 },
    ],
    cards: [
      { id: "c1", title: "우유 사기", priority: undefined, tags: [], dueDate: undefined, subtasks: [], columnId: "todo", order: 0 },
      { id: "c2", title: "빵 사기", priority: undefined, tags: [], dueDate: undefined, subtasks: [], columnId: "todo", order: 1 },
    ],
  };

  it("example 1: To Do → In Progress 이동", async () => {
    renderKanban(initialBoard);
    const card = screen.getByText("우유 사기").closest("[data-card-id]") as HTMLElement;
    const inProgressColumn = getColumn("In Progress");
    fireEvent.dragStart(card);
    fireEvent.dragOver(inProgressColumn);
    fireEvent.drop(inProgressColumn);
    await waitFor(() => {
      expect(within(inProgressColumn).getByText("우유 사기")).toBeInTheDocument();
    });
    const todoColumn = getColumn("To Do");
    expect(within(todoColumn).queryByText("우유 사기")).not.toBeInTheDocument();
  });

  it("example 2: Done → To Do 역방향 이동", async () => {
    const board = {
      ...initialBoard,
      cards: [{ id: "c1", title: "우유 사기", priority: undefined, tags: [], dueDate: undefined, subtasks: [], columnId: "done", order: 0 }],
    };
    renderKanban(board);
    const card = screen.getByText("우유 사기").closest("[data-card-id]") as HTMLElement;
    const todoColumn = getColumn("To Do");
    fireEvent.dragStart(card);
    fireEvent.dragOver(todoColumn);
    fireEvent.drop(todoColumn);
    await waitFor(() => {
      expect(within(todoColumn).getByText("우유 사기")).toBeInTheDocument();
    });
  });

  it("example 3: 같은 칼럼 내 순서 변경", async () => {
    renderKanban(initialBoard);
    const todoColumn = getColumn("To Do");
    const cards = within(todoColumn).getAllByRole("article");
    expect(cards[0]).toHaveTextContent("우유 사기");
    fireEvent.dragStart(cards[1]); // 빵 사기
    fireEvent.dragOver(cards[0]);
    fireEvent.drop(cards[0]);
    await waitFor(() => {
      const updatedCards = within(todoColumn).getAllByRole("article");
      expect(updatedCards[0]).toHaveTextContent("빵 사기");
    });
  });
});

// ──────────────────────────────────────────────
// KANBAN-005: 서브태스크 관리
// ──────────────────────────────────────────────
describe("KANBAN-005: 서브태스크 관리", () => {
  const initialBoard = {
    columns: [
      { id: "todo", name: "To Do", order: 0 },
      { id: "in-progress", name: "In Progress", order: 1 },
      { id: "done", name: "Done", order: 2 },
    ],
    cards: [
      { id: "c1", title: "우유 사기", priority: undefined, tags: [], dueDate: undefined,
        subtasks: [{ id: "s1", text: "두부 1모", checked: false }], columnId: "todo", order: 0 },
    ],
  };

  it("example 1: 서브태스크 추가 → 체크리스트에 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => screen.getByRole("dialog"));
    const subtaskInput = screen.getByRole("textbox", { name: /서브태스크|subtask/i });
    await user.type(subtaskInput, "계란 2판{Enter}");
    expect(screen.getByText("계란 2판")).toBeInTheDocument();
  });

  it("example 2: 서브태스크 체크 → 취소선 + 진행률 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => screen.getByRole("dialog"));
    // Add a second subtask
    const subtaskInput = screen.getByRole("textbox", { name: /서브태스크|subtask/i });
    await user.type(subtaskInput, "계란 2판{Enter}");
    // Check the first subtask
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(screen.getByText(/1\/2/)).toBeInTheDocument();
    // Verify strikethrough on checked subtask label
    const checkedLabel = screen.getByText("두부 1모");
    expect(checkedLabel).toHaveStyle("text-decoration: line-through");
  });
});

// ──────────────────────────────────────────────
// KANBAN-006: 제목 검색
// ──────────────────────────────────────────────
describe("KANBAN-006: 제목 검색", () => {
  const initialBoard = {
    columns: [
      { id: "todo", name: "To Do", order: 0 },
      { id: "in-progress", name: "In Progress", order: 1 },
      { id: "done", name: "Done", order: 2 },
    ],
    cards: [
      { id: "c1", title: "우유 사기", priority: undefined, tags: [], dueDate: undefined, subtasks: [], columnId: "todo", order: 0 },
      { id: "c2", title: "빵 사기", priority: undefined, tags: [], dueDate: undefined, subtasks: [], columnId: "todo", order: 1 },
      { id: "c3", title: "회의록 작성", priority: undefined, tags: [], dueDate: undefined, subtasks: [], columnId: "in-progress", order: 0 },
    ],
  };

  it("example 1: '우유' 검색 → '우유 사기'만 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    const searchInput = screen.getByRole("searchbox");
    await user.type(searchInput, "우유");
    expect(screen.getByText("우유 사기")).toBeInTheDocument();
    expect(screen.queryByText("빵 사기")).not.toBeInTheDocument();
    expect(screen.queryByText("회의록 작성")).not.toBeInTheDocument();
  });

  it("example 2: 검색어 비움 → 전체 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    const searchInput = screen.getByRole("searchbox");
    await user.type(searchInput, "우유");
    await user.clear(searchInput);
    expect(screen.getByText("우유 사기")).toBeInTheDocument();
    expect(screen.getByText("빵 사기")).toBeInTheDocument();
    expect(screen.getByText("회의록 작성")).toBeInTheDocument();
  });

  it("example 3: 매칭 없음 → '검색 결과가 없습니다' 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    const searchInput = screen.getByRole("searchbox");
    await user.type(searchInput, "존재하지않는검색어");
    expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────
// KANBAN-007: 우선순위·태그 필터
// ──────────────────────────────────────────────
describe("KANBAN-007: 우선순위·태그 필터", () => {
  const initialBoard = {
    columns: [
      { id: "todo", name: "To Do", order: 0 },
      { id: "in-progress", name: "In Progress", order: 1 },
      { id: "done", name: "Done", order: 2 },
    ],
    cards: [
      { id: "c1", title: "우유 사기", priority: "높음", tags: ["장보기"], dueDate: undefined, subtasks: [], columnId: "todo", order: 0 },
      { id: "c2", title: "빵 사기", priority: "높음", tags: ["장보기"], dueDate: undefined, subtasks: [], columnId: "todo", order: 1 },
      { id: "c3", title: "회의록 작성", priority: "낮음", tags: ["업무"], dueDate: undefined, subtasks: [], columnId: "in-progress", order: 0 },
    ],
  };

  it("example 1: 우선순위 '높음' 필터 → 높음만 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    const priorityFilter = screen.getByRole("combobox", { name: /우선순위/i });
    await user.click(priorityFilter);
    await user.click(screen.getByRole("option", { name: "높음" }));
    expect(screen.getByText("우유 사기")).toBeInTheDocument();
    expect(screen.getByText("빵 사기")).toBeInTheDocument();
    expect(screen.queryByText("회의록 작성")).not.toBeInTheDocument();
  });

  it("example 2: 태그 '장보기' 필터 → 장보기만 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    const tagFilter = screen.getByRole("combobox", { name: /태그/i });
    await user.click(tagFilter);
    await user.click(screen.getByRole("option", { name: "장보기" }));
    expect(screen.getByText("우유 사기")).toBeInTheDocument();
    expect(screen.getByText("빵 사기")).toBeInTheDocument();
    expect(screen.queryByText("회의록 작성")).not.toBeInTheDocument();
  });

  it("example 3: 우선순위 '높음' + 태그 '장보기' 동시 → AND 조건", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    const priorityFilter = screen.getByRole("combobox", { name: /우선순위/i });
    await user.click(priorityFilter);
    await user.click(screen.getByRole("option", { name: "높음" }));
    const tagFilter = screen.getByRole("combobox", { name: /태그/i });
    await user.click(tagFilter);
    await user.click(screen.getByRole("option", { name: "장보기" }));
    expect(screen.getByText("우유 사기")).toBeInTheDocument();
    expect(screen.queryByText("회의록 작성")).not.toBeInTheDocument();
  });

  it("example 4: 필터 해제 → 모든 카드 표시", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    const priorityFilter = screen.getByRole("combobox", { name: /우선순위/i });
    await user.click(priorityFilter);
    await user.click(screen.getByRole("option", { name: "높음" }));
    await user.click(priorityFilter);
    await user.click(screen.getByRole("option", { name: /전체|모두|all/i }));
    expect(screen.getByText("우유 사기")).toBeInTheDocument();
    expect(screen.getByText("빵 사기")).toBeInTheDocument();
    expect(screen.getByText("회의록 작성")).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────
// KANBAN-008: 다크모드 토글
// ──────────────────────────────────────────────
describe("KANBAN-008: 다크모드 토글", () => {
  it("example 1: 라이트 → 토글 → 다크 모드", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban();
    const toggle = screen.getByRole("switch", { name: /다크모드|dark/i });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    await user.click(toggle);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("example 2: 다크 → 토글 → 라이트 모드", async () => {
    localStorageMock.setItem("kanban-theme", "dark");
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    const toggle = screen.getByRole("switch", { name: /다크모드|dark/i });
    await user.click(toggle);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

// ──────────────────────────────────────────────
// KANBAN-009: 데이터 영속성
// ──────────────────────────────────────────────
describe("KANBAN-009: 데이터 영속성", () => {
  it("example 1: 카드 추가 후 리마운트 → 유지", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = renderKanban();
    const todoColumn = getColumn("To Do");
    await user.click(within(todoColumn).getByRole("button", { name: /추가|add|\+/i }));
    await user.type(within(todoColumn).getByRole("textbox", { name: /제목/i }), "우유 사기");
    await user.click(within(todoColumn).getByRole("button", { name: /확인/i }));
    unmount();
    render(<KanbanPage />);
    expect(screen.getByText("우유 사기")).toBeInTheDocument();
  });

  it("example 2: 카드 이동 후 리마운트 → 유지", async () => {
    const board = {
      columns: [
        { id: "todo", name: "To Do", order: 0 },
        { id: "in-progress", name: "In Progress", order: 1 },
        { id: "done", name: "Done", order: 2 },
      ],
      cards: [{ id: "c1", title: "우유 사기", priority: undefined, tags: [], dueDate: undefined, subtasks: [], columnId: "todo", order: 0 }],
    };
    const { unmount } = renderKanban(board);
    const card = screen.getByText("우유 사기").closest("[data-card-id]") as HTMLElement;
    const doneColumn = getColumn("Done");
    fireEvent.dragStart(card);
    fireEvent.dragOver(doneColumn);
    fireEvent.drop(doneColumn);
    await waitFor(() => within(doneColumn).getByText("우유 사기"));
    unmount();
    render(<KanbanPage />);
    expect(within(getColumn("Done")).getByText("우유 사기")).toBeInTheDocument();
  });

  it("example 3: 서브태스크 체크 후 리마운트 → 유지", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const board = {
      columns: [
        { id: "todo", name: "To Do", order: 0 },
        { id: "in-progress", name: "In Progress", order: 1 },
        { id: "done", name: "Done", order: 2 },
      ],
      cards: [{
        id: "c1", title: "우유 사기", priority: undefined, tags: [], dueDate: undefined,
        subtasks: [{ id: "s1", text: "계란 2판", checked: false }], columnId: "todo", order: 0,
      }],
    };
    const { unmount } = renderKanban(board);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => screen.getByRole("dialog"));
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: /저장|save/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    unmount();
    render(<KanbanPage />);
    await user.click(screen.getByText("우유 사기"));
    await waitFor(() => screen.getByRole("dialog"));
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});

// ──────────────────────────────────────────────
// KANBAN-010: 빈 칼럼 안내
// ──────────────────────────────────────────────
describe("KANBAN-010: 빈 칼럼 안내", () => {
  it("example 1: 빈 칼럼 → '카드가 없습니다' 표시", () => {
    renderKanban();
    const todoColumn = getColumn("To Do");
    expect(within(todoColumn).getByText("카드가 없습니다")).toBeInTheDocument();
  });

  it("example 2: 카드 있는 칼럼 → '카드가 없습니다' 미표시", () => {
    const board = {
      columns: [
        { id: "todo", name: "To Do", order: 0 },
        { id: "in-progress", name: "In Progress", order: 1 },
        { id: "done", name: "Done", order: 2 },
      ],
      cards: [{ id: "c1", title: "우유 사기", priority: undefined, tags: [], dueDate: undefined, subtasks: [], columnId: "todo", order: 0 }],
    };
    renderKanban(board);
    const todoColumn = getColumn("To Do");
    expect(within(todoColumn).queryByText("카드가 없습니다")).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────
// KANBAN-011: 마감일 초과 표시
// ──────────────────────────────────────────────
describe("KANBAN-011: 마감일 초과 표시", () => {
  const board = {
    columns: [
      { id: "todo", name: "To Do", order: 0 },
      { id: "in-progress", name: "In Progress", order: 1 },
      { id: "done", name: "Done", order: 2 },
    ],
    cards: [
      { id: "c1", title: "우유 사기", priority: undefined, tags: [], dueDate: "2026-03-01", subtasks: [], columnId: "todo", order: 0 },
      { id: "c2", title: "빵 사기", priority: undefined, tags: [], dueDate: "2026-03-25", subtasks: [], columnId: "todo", order: 1 },
    ],
  };

  it("example 1: 마감일 2026-03-01, 오늘 2026-03-19 → overdue 표시", () => {
    renderKanban(board);
    const overdueCard = screen.getByText("우유 사기").closest("[data-card-id]") as HTMLElement;
    expect(overdueCard.querySelector("[data-overdue='true']")).toBeInTheDocument();
  });

  it("example 2: 마감일 2026-03-25, 오늘 2026-03-19 → 기본 스타일", () => {
    renderKanban(board);
    const normalCard = screen.getByText("빵 사기").closest("[data-card-id]") as HTMLElement;
    expect(normalCard.querySelector("[data-overdue='true']")).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────
// KANBAN-012: 다크모드 영속성
// ──────────────────────────────────────────────
describe("KANBAN-012: 다크모드 영속성", () => {
  it("example 1: 다크모드 상태에서 리마운트 → 다크 유지", () => {
    localStorageMock.setItem("kanban-theme", "dark");
    renderKanban();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

// ──────────────────────────────────────────────
// KANBAN-013: 검색과 필터 동시 적용
// ──────────────────────────────────────────────
describe("KANBAN-013: 검색과 필터 동시 적용", () => {
  const initialBoard = {
    columns: [
      { id: "todo", name: "To Do", order: 0 },
      { id: "in-progress", name: "In Progress", order: 1 },
      { id: "done", name: "Done", order: 2 },
    ],
    cards: [
      { id: "c1", title: "우유 사기", priority: "높음", tags: [], dueDate: undefined, subtasks: [], columnId: "todo", order: 0 },
      { id: "c2", title: "빵 사기", priority: "높음", tags: [], dueDate: undefined, subtasks: [], columnId: "todo", order: 1 },
      { id: "c3", title: "회의록 작성", priority: "낮음", tags: [], dueDate: undefined, subtasks: [], columnId: "in-progress", order: 0 },
    ],
  };

  it("example 1: 검색 '사기' + 필터 '높음' → AND 조건", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.type(screen.getByRole("searchbox"), "사기");
    const priorityFilter = screen.getByRole("combobox", { name: /우선순위/i });
    await user.click(priorityFilter);
    await user.click(screen.getByRole("option", { name: "높음" }));
    expect(screen.getByText("우유 사기")).toBeInTheDocument();
    expect(screen.getByText("빵 사기")).toBeInTheDocument();
    expect(screen.queryByText("회의록 작성")).not.toBeInTheDocument();
  });

  it("example 2: 검색 '우유' + 필터 '낮음' → 0건", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderKanban(initialBoard);
    await user.type(screen.getByRole("searchbox"), "우유");
    const priorityFilter = screen.getByRole("combobox", { name: /우선순위/i });
    await user.click(priorityFilter);
    await user.click(screen.getByRole("option", { name: "낮음" }));
    expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
  });
});
