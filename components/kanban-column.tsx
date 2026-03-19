"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Field, FieldError } from "@/components/ui/field"
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { Card as CardType, Column } from "@/lib/kanban-types"
import KanbanCard from "./kanban-card"

interface KanbanColumnProps {
  column: Column
  filteredCards: CardType[]
  allCards: CardType[]
  onAddCard: (title: string) => void
  onUpdateCard: (cardId: string, updates: Partial<CardType>) => void
  onDeleteCard: (cardId: string) => void
  dragCardIdRef: React.MutableRefObject<string | null>
  onMoveCard: (
    cardId: string,
    targetColumnId: string,
    targetCardId?: string,
    insertBefore?: boolean,
  ) => void
}

export default function KanbanColumn({
  column,
  filteredCards,
  allCards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  dragCardIdRef,
  onMoveCard,
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [titleError, setTitleError] = useState("")
  const sectionRef = useRef<HTMLElement>(null)

  // Pragmatic DnD: make column a drop target
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    return dropTargetForElements({
      element: el,
      onDrop: ({ source }) => {
        const cardId = source.data.cardId as string
        if (cardId) {
          onMoveCard(cardId, column.id)
        }
      },
    })
  }, [column.id, onMoveCard])

  const handleAdd = () => {
    const title = newTitle.trim()
    if (!title) {
      setTitleError("제목을 입력해주세요")
      return
    }
    onAddCard(title)
    setNewTitle("")
    setTitleError("")
    setIsAdding(false)
  }

  const handleCancel = () => {
    setNewTitle("")
    setTitleError("")
    setIsAdding(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd()
    if (e.key === "Escape") handleCancel()
  }

  // Native drag handlers (for test compatibility)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const cardId =
      (e.dataTransfer?.getData?.("text/plain") || "") ||
      dragCardIdRef.current
    if (cardId) {
      onMoveCard(cardId as string, column.id)
      dragCardIdRef.current = null
    }
  }

  // Native card-level drag handlers
  const handleCardDragOver = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault()
  }

  const handleCardDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault()
    const cardId =
      (e.dataTransfer?.getData?.("text/plain") || "") ||
      dragCardIdRef.current
    if (cardId && cardId !== targetCardId) {
      onMoveCard(cardId as string, column.id, targetCardId, true)
      dragCardIdRef.current = null
    }
  }

  const isEmpty = allCards.length === 0

  return (
    <section
      ref={sectionRef}
      aria-label={column.name}
      className="border rounded-lg overflow-hidden bg-card"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="px-4 py-3 flex items-center justify-between border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{column.name}</span>
          <Badge variant="secondary" className="rounded-full px-2 text-xs">
            {filteredCards.length}
          </Badge>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="추가"
          onClick={() => setIsAdding(true)}
        >
          <PlusIcon />
        </Button>
      </div>

      {/* Card list */}
      <div className="p-3 flex flex-col gap-3 min-h-20">
        {isEmpty && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            카드가 없습니다
          </p>
        )}

        {filteredCards.map(card => (
          <KanbanCard
            key={card.id}
            card={card}
            dragCardIdRef={dragCardIdRef}
            onUpdate={onUpdateCard}
            onDelete={onDeleteCard}
            onDragStart={(cardId) => { dragCardIdRef.current = cardId }}
            onDragOver={handleCardDragOver}
            onDrop={handleCardDrop}
          />
        ))}

        {/* Add card form */}
        {isAdding && (
          <div className="flex flex-col gap-2">
            <Field data-invalid={!!titleError || undefined}>
              <Input
                aria-label="제목"
                placeholder="카드 제목 입력..."
                value={newTitle}
                onChange={e => {
                  setNewTitle(e.target.value)
                  setTitleError("")
                }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {titleError && <FieldError>{titleError}</FieldError>}
            </Field>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>
                확인
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                취소
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
