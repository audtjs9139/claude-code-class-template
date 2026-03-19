# Kanban Todo 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| 드래그&드롭 | @atlaskit/pragmatic-drag-and-drop | 사용자 선택. Atlassian 제작, 성능 우수, 활발한 유지보수 |
| 상태 관리 | React useState + Context | 단일 페이지 로컬 앱으로 외부 상태 라이브러리 불필요 |
| 데이터 저장 | localStorage | spec 요구사항. JSON 직렬화로 보드 전체 상태 저장 |
| 다크모드 | CSS class 토글 + localStorage | shadcn의 dark class 방식 활용, 새로고침 시 유지 |
| 컴포넌트 기반 | shadcn/ui (base-mira, base) | 프로젝트 기존 설정 유지 |
| 아이콘 | hugeicons | components.json의 iconLibrary 설정 |

## Required Skills

| 스킬 | 용도 |
|------|------|
| vercel-react-best-practices | React/Next.js 성능 최적화 규칙 |
| web-design-guidelines | Web Interface Guidelines 접근성·UX 준수 |
| shadcn | shadcn/ui 컴포넌트 규칙 준수, 설치 및 구성 |

## UI Components

### 설치 필요

| 컴포넌트 | 설치 명령 |
|----------|-----------|
| progress | `bunx --bun shadcn@latest add progress` |

### 이미 설치됨

card, badge, dialog, alert-dialog, input, textarea, select, checkbox, switch, button, label, field, input-group, separator, dropdown-menu, combobox

### 외부 의존성

| 패키지 | 설치 명령 | 용도 |
|--------|-----------|------|
| @atlaskit/pragmatic-drag-and-drop | `bun add @atlaskit/pragmatic-drag-and-drop` | 드래그&드롭 |
| @atlaskit/pragmatic-drag-and-drop-hitbox | `bun add @atlaskit/pragmatic-drag-and-drop-hitbox` | 드롭 위치 판정 |
| @atlaskit/pragmatic-drag-and-drop-react-drop-indicator | `bun add @atlaskit/pragmatic-drag-and-drop-react-drop-indicator` | 드롭 인디케이터 UI |

### 커스텀 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| KanbanBoard | 3칼럼 보드 레이아웃 + 검색/필터/다크모드 헤더 |
| KanbanColumn | 단일 칼럼 (헤더 + 카드 리스트 + 추가 버튼) |
| KanbanCard | 카드 표시 (제목, 우선순위, 태그, 마감일, 진행률) |
| CardDetailDialog | 카드 상세 편집 모달 (Dialog 기반) |
| SubtaskList | 서브태스크 체크리스트 + 진행률 바 |
| SearchFilterBar | 검색 + 우선순위/태그 필터 + 다크모드 토글 |

## 실행 프로토콜

- 각 task 시작 전, **참조 규칙**에 나열된 파일을 반드시 읽고 규칙을 준수하며 구현한다

## Tasks

### Task 0: 프로젝트 셋업

- **시나리오**: (선행 작업)
- **참조 규칙**: `.claude/skills/shadcn/SKILL.md`
- **구현 대상**:
  - `bunx --bun shadcn@latest add progress` 실행
  - `bun add @atlaskit/pragmatic-drag-and-drop @atlaskit/pragmatic-drag-and-drop-hitbox @atlaskit/pragmatic-drag-and-drop-react-drop-indicator` 실행
  - 타입 정의 파일 `lib/kanban-types.ts` 생성 (Card, Column, Board 타입)
  - localStorage 유틸 `lib/kanban-storage.ts` 생성 (load/save)
- **수용 기준**:
  - [ ] `bun run build` 성공
  - [ ] progress 컴포넌트가 `components/ui/progress.tsx`에 존재
  - [ ] `@atlaskit/pragmatic-drag-and-drop`가 `package.json` dependencies에 존재
  - [ ] `KanbanBoard` 타입에 columns(3개 고정), cards 필드 포함
  - [ ] `loadBoard()` → localStorage에서 JSON 파싱, `saveBoard()` → localStorage에 JSON 저장
- **커밋**: `chore: add progress component and dnd dependencies`

---

### Task 1: spec 테스트 생성

- **시나리오**: KANBAN-001 ~ KANBAN-013
- **참조 규칙**: `artifacts/spec.yaml`, `artifacts/kanban/wireframe.html`, `CLAUDE.md`(테스트 파일 컨벤션)
- **구현 대상**:
  - `app/kanban.spec.test.tsx` — spec.yaml의 13개 시나리오를 수용 기준 테스트로 변환
  - 요소 선택은 `getByRole`, `getByLabelText`, `getByText` 등 안정적 패턴 사용
  - wireframe의 컴포넌트 타입에 맞는 인터랙션 패턴 사용 (Dialog, Select, Checkbox 등)
- **수용 기준**:
  - [ ] `bun run test kanban.spec.test` 실행 시 13개 시나리오에 대응하는 테스트가 모두 FAIL (Red 상태)
  - [ ] 각 테스트의 describe 블록에 시나리오 ID (KANBAN-XXX) 명시
  - [ ] 내부 상태 접근 없이 화면 요소로만 단언
- **커밋**: `test: add spec tests for kanban board (KANBAN-001~013)`

---

### Task 2: 칸반 보드 기본 레이아웃 + 카드 표시

- **시나리오**: KANBAN-010 (빈 칼럼 안내), KANBAN-011 (마감일 초과)
- **참조 규칙**:
  - `.claude/skills/shadcn/rules/styling.md` — semantic 색상, gap 사용, cn()
  - `.claude/skills/shadcn/rules/composition.md` — Card 구성, Badge 사용, Empty 상태
  - `.claude/skills/shadcn/rules/icons.md` — hugeicons, data-icon
  - `.claude/skills/vercel-react-best-practices/rules/rerender-no-inline-components.md`
  - `web-design-guidelines` (URL fetch)
- **구현 대상**:
  - `app/page.tsx` — KanbanBoard를 렌더링하는 페이지
  - `components/kanban-board.tsx` — 3칼럼 그리드 레이아웃 + SearchFilterBar 헤더
  - `components/kanban-column.tsx` — 칼럼 헤더(이름, 카드 수 Badge, + 버튼) + 카드 리스트 + 빈 칼럼 안내
  - `components/kanban-card.tsx` — Card 컴포넌트 (제목, 우선순위 Badge, 태그 Badge, 마감일, 서브태스크 진행률)
  - localStorage에서 보드 데이터 로드하여 표시
  - 마감일 초과 카드는 overdue 스타일 적용
- **수용 기준**:
  - [ ] 3개 칼럼(To Do, In Progress, Done)이 그리드로 표시
  - [ ] 빈 칼럼에 "카드가 없습니다" 안내 문구 표시 (KANBAN-010)
  - [ ] 마감일 `2026-03-01` + 오늘 `2026-03-19` → overdue 강조 표시 (KANBAN-011)
  - [ ] 마감일 `2026-03-25` → 기본 스타일 (KANBAN-011)
  - [ ] `bun run test kanban.spec.test` — KANBAN-010, KANBAN-011 PASS
- **커밋**: `feat: add kanban board layout with columns and cards`

---

### Task 3: 카드 추가 (CRUD - Create)

- **시나리오**: KANBAN-001
- **참조 규칙**:
  - `.claude/skills/shadcn/rules/forms.md` — Field, validation (data-invalid, aria-invalid)
  - `.claude/skills/shadcn/rules/composition.md` — Button
  - `.claude/skills/vercel-react-best-practices/rules/rerender-functional-setstate.md`
- **구현 대상**:
  - `components/kanban-column.tsx`에 추가 기능 확장: + 버튼 클릭 → 제목 Input 표시 → 확인/취소
  - 빈 제목 제출 시 "제목을 입력해주세요" 에러 메시지 (Field validation)
  - 추가된 카드는 해당 칼럼 하단에 배치
  - localStorage 자동 저장
- **수용 기준**:
  - [ ] + 버튼 클릭 → 제목 Input 표시 (KANBAN-001 example 1)
  - [ ] "우유 사기" 입력 후 확인 → "To Do" 칼럼에 카드 표시 (KANBAN-001 example 2)
  - [ ] 빈 제목으로 확인 → "제목을 입력해주세요" 에러 (KANBAN-001 example 3)
  - [ ] `bun run test kanban.spec.test` — KANBAN-001 PASS
- **커밋**: `feat: add card creation with validation`

---

### Task 4: 카드 상세 편집 + 서브태스크

- **시나리오**: KANBAN-002, KANBAN-005
- **참조 규칙**:
  - `.claude/skills/shadcn/rules/forms.md` — FieldGroup, Field, InputGroup
  - `.claude/skills/shadcn/rules/composition.md` — Dialog(Title 필수), Card 구성
  - `.claude/skills/shadcn/rules/base-vs-radix.md` — base 라이브러리 Select API
  - `.claude/skills/shadcn/rules/icons.md` — hugeicons, data-icon
  - `.claude/skills/vercel-react-best-practices/rules/rerender-derived-state-no-effect.md`
- **구현 대상**:
  - `components/card-detail-dialog.tsx` — Dialog 기반 상세 편집 모달
    - 제목 Input, 설명 Textarea, 우선순위 Select(높음/중간/낮음), 마감일 Input(date), 태그 Input(자유 입력 + Badge ✕ 제거)
  - `components/subtask-list.tsx` — 서브태스크 Checkbox 리스트 + 추가 Input + Progress 바
    - 체크 시 취소선, 진행률 "N/M" 텍스트 + Progress 바
  - 카드 클릭 → Dialog 열림, Save 클릭 → 변경 반영 + localStorage 저장
- **수용 기준**:
  - [ ] "우유 사기" 카드 클릭 → Dialog 열림, 제목 "우유 사기" 표시 (KANBAN-002 example 1)
  - [ ] 제목 "빵 사기"로 변경 후 저장 → 카드 제목 "빵 사기" (KANBAN-002 example 2)
  - [ ] 우선순위 "높음" 변경 → Badge "높음" 표시 (KANBAN-002 example 3)
  - [ ] 태그 "장보기" 추가 → Badge "장보기" 표시 (KANBAN-002 example 4)
  - [ ] 마감일 "2026-03-25" 설정 → 마감일 표시 (KANBAN-002 example 5)
  - [ ] 서브태스크 "계란 2판" 추가 → 체크리스트에 표시 (KANBAN-005 example 1)
  - [ ] 서브태스크 체크 → 취소선 + "1/2" 진행률 (KANBAN-005 example 2)
  - [ ] `bun run test kanban.spec.test` — KANBAN-002, KANBAN-005 PASS
- **커밋**: `feat: add card detail editing and subtask management`

---

### Task 5: 카드 삭제

- **시나리오**: KANBAN-003
- **참조 규칙**:
  - `.claude/skills/shadcn/rules/composition.md` — AlertDialog(Title 필수)
- **구현 대상**:
  - `components/card-detail-dialog.tsx`에 Delete 버튼 추가
  - Delete 클릭 → AlertDialog "정말 삭제하시겠습니까?" 표시
  - 확인 → 카드 삭제 + localStorage 저장, 취소 → Dialog 유지
- **수용 기준**:
  - [ ] Delete 클릭 → "정말 삭제하시겠습니까?" AlertDialog 표시 (KANBAN-003 example 1)
  - [ ] 확인 → 카드 삭제됨 (KANBAN-003 example 1)
  - [ ] 취소 → 카드 유지 (KANBAN-003 example 2)
  - [ ] `bun run test kanban.spec.test` — KANBAN-003 PASS
- **커밋**: `feat: add card deletion with confirmation`

---

### Task 6: 드래그&드롭

- **시나리오**: KANBAN-004
- **참조 규칙**:
  - `.claude/skills/vercel-react-best-practices/rules/rerender-use-ref-transient-values.md` — 드래그 중 transient 값은 ref 사용
  - `.claude/skills/vercel-react-best-practices/rules/js-set-map-lookups.md` — 카드 ID lookup
- **구현 대상**:
  - `components/kanban-card.tsx`에 pragmatic-drag-and-drop draggable 적용
  - `components/kanban-column.tsx`에 drop target 적용
  - 칼럼 간 이동 + 칼럼 내 순서 변경 지원
  - 드롭 인디케이터 표시
  - 이동 후 localStorage 자동 저장
- **수용 기준**:
  - [ ] "To Do" → "In Progress" 드래그 → 칼럼 이동 (KANBAN-004 example 1)
  - [ ] "Done" → "To Do" 드래그 → 역방향 이동 (KANBAN-004 example 2)
  - [ ] 같은 칼럼 내 순서 변경 (KANBAN-004 example 3)
  - [ ] `bun run test kanban.spec.test` — KANBAN-004 PASS
- **커밋**: `feat: add drag and drop for cards`

---

### Task 7: 검색·필터

- **시나리오**: KANBAN-006, KANBAN-007, KANBAN-013
- **참조 규칙**:
  - `.claude/skills/shadcn/rules/forms.md` — InputGroup
  - `.claude/skills/shadcn/rules/composition.md` — DropdownMenu, Select
  - `.claude/skills/vercel-react-best-practices/rules/rerender-derived-state-no-effect.md` — 필터 결과를 render 중 계산
  - `.claude/skills/vercel-react-best-practices/rules/rerender-transitions.md` — 검색 입력에 startTransition
- **구현 대상**:
  - `components/search-filter-bar.tsx` — 검색 InputGroup + 우선순위 Select + 태그 Select
  - Active filters 인디케이터: 적용 중인 필터를 Badge로 표시 + 개별 ✕ 제거 + "Clear all" 버튼
  - 검색: 제목 포함 여부 실시간 필터링
  - 필터: 우선순위·태그 AND 조건
  - 검색 + 필터 동시 적용
  - 결과 0건 시 "검색 결과가 없습니다" 표시
- **수용 기준**:
  - [ ] "우유" 검색 → "우유 사기"만 표시 (KANBAN-006 example 1)
  - [ ] 검색어 비움 → 전체 표시 (KANBAN-006 example 2)
  - [ ] 매칭 없음 → "검색 결과가 없습니다" (KANBAN-006 example 3)
  - [ ] 우선순위 "높음" 필터 → 높음만 표시 (KANBAN-007 example 1)
  - [ ] 태그 "장보기" 필터 → 장보기만 표시 (KANBAN-007 example 2)
  - [ ] 우선순위 "높음" + 태그 "장보기" 동시 선택 → 두 조건 모두 만족하는 카드만 표시 (KANBAN-007 example 3)
  - [ ] 필터 해제 → 모든 카드 다시 표시 (KANBAN-007 example 4)
  - [ ] 검색 "사기" + 필터 "높음" → AND 조건 (KANBAN-013 example 1)
  - [ ] 검색 "우유" + 필터 "낮음" → 0건 + "검색 결과가 없습니다" (KANBAN-013 example 2)
  - [ ] `bun run test kanban.spec.test` — KANBAN-006, KANBAN-007, KANBAN-013 PASS
- **커밋**: `feat: add search and filter functionality`

---

### Task 8: 다크모드

- **시나리오**: KANBAN-008, KANBAN-012
- **참조 규칙**:
  - `.claude/skills/shadcn/rules/styling.md` — dark: 수동 오버라이드 금지, semantic 토큰 사용
  - `.claude/skills/vercel-react-best-practices/rules/rendering-hydration-no-flicker.md` — SSR 깜빡임 방지
  - `.claude/skills/vercel-react-best-practices/rules/client-localstorage-schema.md` — localStorage 스키마 버전 관리
- **구현 대상**:
  - `components/search-filter-bar.tsx`에 Switch 토글 추가 (sun/moon 아이콘)
  - `<html>` 요소에 `dark` class 토글
  - localStorage에 테마 저장, 새로고침 시 복원
  - 초기 로드 시 깜빡임 방지 (inline script)
- **수용 기준**:
  - [ ] 라이트 → 토글 → 다크 모드 전환 (KANBAN-008 example 1)
  - [ ] 다크 → 토글 → 라이트 모드 전환 (KANBAN-008 example 2)
  - [ ] 다크 모드 상태에서 새로고침 → 다크 유지 (KANBAN-012)
  - [ ] `bun run test kanban.spec.test` — KANBAN-008, KANBAN-012 PASS
- **커밋**: `feat: add dark mode toggle with persistence`

---

### Task 9: 데이터 영속성 통합 검증

- **시나리오**: KANBAN-009
- **참조 규칙**:
  - `.claude/skills/vercel-react-best-practices/rules/client-localstorage-schema.md`
- **구현 대상**:
  - 모든 CRUD·이동·서브태스크 변경이 localStorage에 즉시 반영되는지 통합 검증
  - 필요시 저장 로직 보완
- **수용 기준**:
  - [ ] 카드 추가 후 새로고침 → 유지 (KANBAN-009 example 1)
  - [ ] 카드 이동 후 새로고침 → 유지 (KANBAN-009 example 2)
  - [ ] 서브태스크 체크 후 새로고침 → 유지 (KANBAN-009 example 3)
  - [ ] `bun run test kanban.spec.test` — KANBAN-009 PASS
  - [ ] `bun run test` — 전체 테스트 PASS
- **커밋**: `test: verify data persistence across all operations`

---

## 미결정 사항
- 없음
