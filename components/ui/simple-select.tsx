"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SimpleSelectOption {
  value: string
  label: string
}

interface SimpleSelectProps {
  value: string
  onValueChange: (v: string) => void
  options: SimpleSelectOption[]
  placeholder?: string
  "aria-label"?: string
  className?: string
}

/**
 * Lightweight select that works reliably in jsdom tests.
 * Renders a button[role=combobox] + ul[role=listbox] with li[role=option].
 */
export function SimpleSelect({
  value,
  onValueChange,
  options,
  placeholder,
  "aria-label": ariaLabel,
  className,
}: SimpleSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 h-8"
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground pointer-events-none" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 min-w-full overflow-auto rounded-lg border border-input bg-popover shadow-md"
        >
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onValueChange(opt.value)
                setOpen(false)
              }}
              className={cn(
                "cursor-default px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                opt.value === value && "bg-accent/50"
              )}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
