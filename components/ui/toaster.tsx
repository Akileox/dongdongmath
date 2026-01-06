"use client"

import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
    const { toasts, dismiss } = useToast()

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all mb-4
            ${toast.variant === 'destructive' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-950'}
            `}
                >
                    <div className="grid gap-1">
                        {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
                        {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
                    </div>
                    <button onClick={() => dismiss(toast.id)} className="absolute right-2 top-2 rounded-md p-1 opacity-50 hover:opacity-100">
                        ✕
                    </button>
                </div>
            ))}
        </div>
    )
}
