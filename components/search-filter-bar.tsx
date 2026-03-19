"use client"

import { SunIcon, MoonIcon, SearchIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { SimpleSelect } from "@/components/ui/simple-select"

interface SearchFilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  priorityFilter: string   // "" means no filter
  onPriorityFilterChange: (v: string) => void
  tagFilter: string        // "" means no filter
  onTagFilterChange: (v: string) => void
  allTags: string[]
  isDark: boolean
  onDarkModeToggle: () => void
}

const PRIORITY_ALL = "__all__"
const TAG_ALL = "__all__"

const BASE_PRIORITY_OPTIONS = [
  { value: PRIORITY_ALL, label: "전체" },
  { value: "높음", label: "높음" },
  { value: "중간", label: "중간" },
  { value: "낮음", label: "낮음" },
]

export default function SearchFilterBar({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  tagFilter,
  onTagFilterChange,
  allTags,
  isDark,
  onDarkModeToggle,
}: SearchFilterBarProps) {
  const tagOptions = [
    { value: TAG_ALL, label: "전체" },
    ...allTags.map(t => ({ value: t, label: t })),
  ]

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
      <h1 className="text-base font-bold shrink-0">Kanban Todo</h1>

      {/* Search */}
      <InputGroup className="flex-1 md:max-w-xs">
        <InputGroupAddon align="inline-start">
          <SearchIcon className="size-4 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="제목으로 검색..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="검색"
        />
      </InputGroup>

      {/* Priority filter */}
      <SimpleSelect
        aria-label="우선순위"
        value={priorityFilter || PRIORITY_ALL}
        onValueChange={v => onPriorityFilterChange(v === PRIORITY_ALL ? "" : v)}
        options={BASE_PRIORITY_OPTIONS}
        placeholder="우선순위"
        className="w-32"
      />

      {/* Tag filter */}
      <SimpleSelect
        aria-label="태그"
        value={tagFilter || TAG_ALL}
        onValueChange={v => onTagFilterChange(v === TAG_ALL ? "" : v)}
        options={tagOptions}
        placeholder="태그"
        className="w-32"
      />

      {/* Dark mode toggle */}
      <div className="flex items-center gap-2 md:ml-auto">
        <SunIcon className="size-4" />
        <Switch
          checked={isDark}
          onCheckedChange={onDarkModeToggle}
          aria-label="다크모드"
        />
        <MoonIcon className="size-4 text-muted-foreground" />
        <Label className="sr-only">다크모드</Label>
      </div>
    </div>
  )
}
