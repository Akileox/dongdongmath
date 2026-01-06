"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const PopoverContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

export function Popover({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <PopoverContext.Provider value={{ open, setOpen }}>
            <div ref={ref} className="relative inline-block">
                {children}
            </div>
        </PopoverContext.Provider>
    )
}

export function PopoverTrigger({ asChild, children }: { asChild?: boolean, children: React.ReactNode }) {
    const ctx = React.useContext(PopoverContext)

    if (asChild) {
        const child = React.Children.only(children) as React.ReactElement<any>
        return React.cloneElement(child, {
            onClick: (e: any) => {
                child.props.onClick?.(e)
                ctx?.setOpen(!ctx.open)
            }
        })
    }

    return (
        <button type="button" onClick={() => ctx?.setOpen(!ctx.open)}>
            {children}
        </button>
    )
}

export function PopoverContent({ className, children }: { className?: string, children: React.ReactNode }) {
    const ctx = React.useContext(PopoverContext)
    if (!ctx?.open) return null

    return (
        <div className={cn("absolute z-50 mt-2 rounded-md border bg-white shadow-md outline-none animate-in fade-in-0 zoom-in-95", className)}>
            {children}
        </div>
    )
}
