"use client"

import { useState, KeyboardEvent } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Subtask } from "@/lib/kanban-types"
import { cn } from "@/lib/utils"

let _subtaskIdCounter = 0
function generateSubtaskId() {
  return `subtask-${++_subtaskIdCounter}`
}

interface SubtaskListProps {
  subtasks: Subtask[]
  onChange: (subtasks: Subtask[]) => void
}

export default function SubtaskList({ subtasks, onChange }: SubtaskListProps) {
  const [newText, setNewText] = useState("")

  const completed = subtasks.filter(s => s.checked).length
  const total = subtasks.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const handleCheck = (id: string, checked: boolean) => {
    onChange(subtasks.map(s => s.id === id ? { ...s, checked } : s))
  }

  const handleAdd = () => {
    const text = newText.trim()
    if (!text) return
    onChange([...subtasks, { id: generateSubtaskId(), text, checked: false }])
    setNewText("")
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Progress */}
      {total > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{completed}/{total}</span>
          <Progress value={progress} className="flex-1 h-1.5" />
        </div>
      )}

      {/* Subtask list */}
      <div className="flex flex-col gap-2">
        {subtasks.map(subtask => (
          <div key={subtask.id} className="flex items-center gap-2">
            <Checkbox
              checked={subtask.checked}
              onCheckedChange={(checked) => handleCheck(subtask.id, !!checked)}
            />
            <span
              className={cn("text-sm", subtask.checked && "text-muted-foreground")}
              style={subtask.checked ? { textDecoration: "line-through" } : undefined}
            >
              {subtask.text}
            </span>
          </div>
        ))}
      </div>

      {/* Add subtask input */}
      <Input
        aria-label="서브태스크"
        placeholder="서브태스크 추가..."
        value={newText}
        onChange={e => setNewText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
