"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

// Context to share state between Select parts
const SelectContext = React.createContext<{
    value: string
    onValueChange: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

export function Select({ value, onValueChange, children }: { value: string, onValueChange: (val: string) => void, children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative inline-block w-full">{children}</div>
        </SelectContext.Provider>
    )
}

export function SelectTrigger({ className, children }: { className?: string, children: React.ReactNode }) {
    const ctx = React.useContext(SelectContext)
    if (!ctx) return null
    return (
        <button
            type="button"
            onClick={() => ctx.setOpen(!ctx.open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
}

export function SelectValue({ placeholder }: { placeholder: string }) {
    const ctx = React.useContext(SelectContext)
    // We can't easily show the selected Label here without mapping, 
    // so simplified usage often requires passing children or doing lookup.
    // For this simple custom implementation, we might depend on parent passing the label, 
    // OR we assume the children of SelectContent are static and we can't find label easily.
    // Hack: We display value if set, else placeholder. Ideally we find the child with that value.
    if (!ctx) return null
    return <span className="block truncate">{ctx.value || placeholder}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
    const ctx = React.useContext(SelectContext)
    if (!ctx || !ctx.open) return null

    return (
        <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-popover-foreground shadow-md animate-in fade-in-80 w-full mt-1">
            <div className="p-1 max-h-[200px] overflow-y-auto">
                {children}
            </div>
        </div>
    )
}

export function SelectItem({ value, children }: { value: string, children: React.ReactNode }) {
    const ctx = React.useContext(SelectContext)
    if (!ctx) return null

    const isSelected = ctx.value === value

    return (
        <div
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 cursor-pointer",
                isSelected && "bg-gray-100 font-medium"
            )}
            onClick={() => {
                ctx.onValueChange(value)
                ctx.setOpen(false)
            }}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
            </span>
            {children}
        </div>
    )
}
