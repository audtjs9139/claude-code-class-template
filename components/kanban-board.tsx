"use client"

import React, { useState, useEffect, useMemo, useRef, startTransition } from "react"

let _cardIdCounter = 0
function generateCardId() {
  return `card-${++_cardIdCounter}`
}
import { Board, Card } from "@/lib/kanban-types"
import { loadBoard, saveBoard } from "@/lib/kanban-storage"
import KanbanColumn from "./kanban-column"
import SearchFilterBar from "./search-filter-bar"

export default function KanbanBoard() {
  const [board, setBoard] = useState<Board>(() => loadBoard())
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("")
  const [tagFilter, setTagFilter] = useState<string>("")
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false
    const dark = localStorage.getItem("kanban-theme") === "dark"
    if (dark) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
    return dark
  })

  const dragCardIdRef = useRef<string | null>(null)

  // Sync dark mode class and persist
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("kanban-theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("kanban-theme", "light")
    }
  }, [isDark])

  // Persist board to localStorage
  useEffect(() => {
    saveBoard(board)
  }, [board])

  // Collect all unique tags from board cards
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    board.cards.forEach(c => c.tags.forEach(t => tagSet.add(t)))
    return Array.from(tagSet)
  }, [board.cards])

  // Derive filtered cards during render (no useEffect)
  const filteredCards = useMemo(() => {
    return board.cards.filter(card => {
      const matchSearch = !search || card.title.includes(search)
      const matchPriority = !priorityFilter || card.priority === priorityFilter
      const matchTag = !tagFilter || card.tags.includes(tagFilter)
      return matchSearch && matchPriority && matchTag
    })
  }, [board.cards, search, priorityFilter, tagFilter])

  const hasFilter = !!(search || priorityFilter || tagFilter)
  const showNoResults = hasFilter && filteredCards.length === 0

  // ── Board Actions ──────────────────────────────────────
  const handleAddCard = (columnId: string, title: string) => {
    const colCards = board.cards.filter(c => c.columnId === columnId)
    const newCard: Card = {
      id: generateCardId(),
      title,
      tags: [],
      subtasks: [],
      columnId,
      order: colCards.length,
    }
    setBoard(prev => ({ ...prev, cards: [...prev.cards, newCard] }))
  }

  const handleUpdateCard = (cardId: string, updates: Partial<Card>) => {
    setBoard(prev => ({
      ...prev,
      cards: prev.cards.map(c => c.id === cardId ? { ...c, ...updates } : c),
    }))
  }

  const handleDeleteCard = (cardId: string) => {
    setBoard(prev => ({
      ...prev,
      cards: prev.cards.filter(c => c.id !== cardId),
    }))
  }

  const handleMoveCard = (
    cardId: string,
    targetColumnId: string,
    targetCardId?: string,
    insertBefore?: boolean,
  ) => {
    setBoard(prev => {
      const card = prev.cards.find(c => c.id === cardId)
      if (!card) return prev

      // Remove the card from its current position
      let remaining = prev.cards.filter(c => c.id !== cardId)

      if (targetCardId) {
        const targetIdx = remaining.findIndex(c => c.id === targetCardId)
        const insertIdx = insertBefore !== false ? targetIdx : targetIdx + 1
        remaining = [
          ...remaining.slice(0, insertIdx),
          { ...card, columnId: targetColumnId },
          ...remaining.slice(insertIdx),
        ]
      } else {
        remaining = [...remaining, { ...card, columnId: targetColumnId }]
      }

      // Re-assign order within each column
      const colMap = new Map<string, number>()
      const reordered = remaining.map(c => {
        const idx = colMap.get(c.columnId) ?? 0
        colMap.set(c.columnId, idx + 1)
        return { ...c, order: idx }
      })

      return { ...prev, cards: reordered }
    })
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <SearchFilterBar
          search={search}
          onSearchChange={(v) => startTransition(() => setSearch(v))}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          allTags={allTags}
          isDark={isDark}
          onDarkModeToggle={() => setIsDark(prev => !prev)}
        />

        {showNoResults && (
          <p className="text-center text-muted-foreground py-8">
            검색 결과가 없습니다
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {board.columns
            .slice()
            .sort((a, b) => a.order - b.order)
            .map(column => {
              const colFilteredCards = filteredCards
                .filter(c => c.columnId === column.id)
                .sort((a, b) => a.order - b.order)
              const colAllCards = board.cards
                .filter(c => c.columnId === column.id)
                .sort((a, b) => a.order - b.order)

              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  filteredCards={colFilteredCards}
                  allCards={colAllCards}
                  onAddCard={(title) => handleAddCard(column.id, title)}
                  onUpdateCard={handleUpdateCard}
                  onDeleteCard={handleDeleteCard}
                  dragCardIdRef={dragCardIdRef}
                  onMoveCard={handleMoveCard}
                />
              )
            })}
        </div>
      </div>
    </div>
  )
}
