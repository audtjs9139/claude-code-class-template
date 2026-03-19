"use client"

import { useState, useEffect, useRef } from "react"
import { CalendarIcon, CheckSquareIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Card as CardType } from "@/lib/kanban-types"
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import CardDetailDialog from "./card-detail-dialog"

interface KanbanCardProps {
  card: CardType
  dragCardIdRef: React.MutableRefObject<string | null>
  onUpdate: (cardId: string, updates: Partial<CardType>) => void
  onDelete: (cardId: string) => void
  onDragStart: (cardId: string) => void
  onDragOver: (e: React.DragEvent, cardId: string) => void
  onDrop: (e: React.DragEvent, cardId: string) => void
}

function isOverdue(dueDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + "T00:00:00")
  return due < today
}

export default function KanbanCard({
  card,
  dragCardIdRef,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: KanbanCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const cardRef = useRef<HTMLElement>(null)

  const completed = card.subtasks.filter(s => s.checked).length
  const total = card.subtasks.length
  const overdue = card.dueDate ? isOverdue(card.dueDate) : false

  // Pragmatic DnD setup (for real browser use)
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    return draggable({
      element: el,
      getInitialData: () => ({ cardId: card.id, columnId: card.columnId }),
    })
  }, [card.id, card.columnId])

  const handleDragStart = (e: React.DragEvent) => {
    dragCardIdRef.current = card.id
    try {
      e.dataTransfer?.setData("text/plain", card.id)
    } catch {
      // ignore in test environment
    }
    onDragStart(card.id)
  }

  const handleDragEnd = () => {
    dragCardIdRef.current = null
  }

  return (
    <>
      <article
        ref={cardRef}
        data-card-id={card.id}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={e => { e.preventDefault(); onDragOver(e, card.id) }}
        onDrop={e => { e.preventDefault(); onDrop(e, card.id) }}
        onClick={() => setDialogOpen(true)}
        className={cn(
          "border rounded-lg p-3 bg-card cursor-pointer hover:shadow-sm transition-shadow select-none",
        )}
      >
        {/* Title + Priority */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{card.title}</span>
          {card.priority && (
            <Badge variant="secondary" className="shrink-0 ml-2">
              {card.priority}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Due date + Subtask progress */}
        <div className="flex items-center justify-between">
          {card.dueDate && (
            <div
              className="flex items-center gap-1"
              data-overdue={overdue ? "true" : "false"}
            >
              <CalendarIcon className="size-3" />
              <span
                className={cn(
                  "text-xs",
                  overdue ? "text-destructive font-medium" : "text-muted-foreground"
                )}
              >
                {card.dueDate}
              </span>
              {overdue && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  overdue
                </Badge>
              )}
            </div>
          )}
          {total > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <CheckSquareIcon className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {completed}/{total}
              </span>
            </div>
          )}
        </div>
      </article>

      <CardDetailDialog
        card={card}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={(updates) => onUpdate(card.id, updates)}
        onDelete={() => onDelete(card.id)}
      />
    </>
  )
}
