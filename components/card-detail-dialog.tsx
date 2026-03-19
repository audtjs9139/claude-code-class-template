"use client"

import { useState, KeyboardEvent } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { XIcon } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { SimpleSelect } from "@/components/ui/simple-select"
import SubtaskList from "./subtask-list"
import { Card, Priority, Subtask } from "@/lib/kanban-types"

const PRIORITY_OPTIONS = [
  { value: "__none__", label: "없음" },
  { value: "높음", label: "높음" },
  { value: "중간", label: "중간" },
  { value: "낮음", label: "낮음" },
]

interface CardDetailDialogProps {
  card: Card
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updates: Partial<Card>) => void
  onDelete: () => void
}

export default function CardDetailDialog({
  card,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: CardDetailDialogProps) {
  const [title, setTitle] = useState(card.title)
  const [priority, setPriority] = useState<Priority | "__none__">(card.priority ?? "__none__")
  const [tags, setTags] = useState<string[]>(card.tags)
  const [tagInput, setTagInput] = useState("")
  const [dueDate, setDueDate] = useState(card.dueDate ?? "")
  const [subtasks, setSubtasks] = useState<Subtask[]>(card.subtasks)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Reset state when card changes
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setTitle(card.title)
      setPriority(card.priority ?? "__none__")
      setTags(card.tags)
      setTagInput("")
      setDueDate(card.dueDate ?? "")
      setSubtasks(card.subtasks)
    }
    onOpenChange(o)
  }

  const handleSave = () => {
    onSave({
      title,
      priority: priority === "__none__" ? undefined : priority as Priority,
      tags,
      dueDate: dueDate || undefined,
      subtasks,
    })
    onOpenChange(false)
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const tag = tagInput.trim()
      if (tag && !tags.includes(tag)) {
        setTags(prev => [...prev, tag])
      }
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  const handleConfirmDelete = () => {
    onDelete()
    setShowDeleteDialog(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>카드 편집</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            {/* Title */}
            <Field>
              <FieldLabel htmlFor="card-title">제목</FieldLabel>
              <Input
                id="card-title"
                aria-label="제목"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </Field>

            {/* Priority */}
            <Field>
              <FieldLabel>우선순위</FieldLabel>
              <SimpleSelect
                aria-label="우선순위"
                value={priority}
                onValueChange={v => setPriority(v as Priority | "__none__")}
                options={PRIORITY_OPTIONS}
                placeholder="우선순위 선택"
              />
            </Field>

            {/* Tags */}
            <Field>
              <FieldLabel htmlFor="card-tags">태그</FieldLabel>
              <div className="flex flex-wrap gap-1 mb-1">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1"
                      aria-label={`태그 ${tag} 제거`}
                    >
                      <XIcon className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                id="card-tags"
                aria-label="태그"
                placeholder="태그 입력 후 Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </Field>

            {/* Due date */}
            <Field>
              <FieldLabel htmlFor="card-due-date">마감일</FieldLabel>
              <Input
                id="card-due-date"
                type="date"
                aria-label="마감일"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </Field>

            {/* Subtasks */}
            <Field>
              <FieldLabel>서브태스크</FieldLabel>
              <SubtaskList subtasks={subtasks} onChange={setSubtasks} />
            </Field>
          </FieldGroup>

          {/* Footer actions */}
          <div className="flex justify-between gap-2 mt-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              삭제
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button onClick={handleSave}>저장</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} variant="destructive">
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
