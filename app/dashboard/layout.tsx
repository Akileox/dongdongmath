'use client'

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Menu, X, MessageSquare } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const supabase = createClient()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Unread Messages State
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        const fetchUnreadCount = async () => {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false)
                .eq('receiver_id', (await supabase.auth.getUser()).data.user?.id)

            if (!error && count !== null) setUnreadCount(count)
        }

        // Initial fetch
        fetchUnreadCount()

        // Subscription for real-time updates
        const channel = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
                fetchUnreadCount()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh() // Clear Server Component cache
        router.push('/login') // Redirect to login
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 relative">
            <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="text-lg font-bold text-black tracking-tight hover:opacity-80 transition-opacity font-sans">
                            DONGDONG MATH
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/notices" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">공지사항</Link>
                        <Link href="/questions" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">질문게시판</Link>
                        <Link href="/auth/change-password" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                            비밀번호 변경
                        </Link>
                        <Link href="/dashboard/dm" className="text-sm font-medium text-gray-600 hover:text-black transition-colors flex items-center gap-1 relative">
                            <div className="relative">
                                <MessageSquare className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[16px] flex items-center justify-center shadow-sm border border-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="hidden lg:inline">쪽지</span>
                        </Link>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <Button variant="ghost" onClick={handleLogout} className="text-sm text-gray-500 hover:text-black hover:bg-gray-100">
                            로그아웃
                        </Button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-2">
                        <Link
                            href="/notices"
                            className="p-2 hover:bg-gray-50 rounded-md font-medium text-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            공지사항
                        </Link>
                        <Link
                            href="/questions"
                            className="p-2 hover:bg-gray-50 rounded-md font-medium text-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            질문게시판
                        </Link>
                        <Link
                            href="/auth/change-password"
                            className="p-2 hover:bg-gray-50 rounded-md font-medium text-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            비밀번호 변경
                        </Link>
                        <Link
                            href="/dashboard/dm"
                            className="p-2 hover:bg-gray-50 rounded-md font-medium text-gray-700 flex items-center gap-1"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <div className="relative">
                                <MessageSquare className="w-4 h-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[16px] flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            쪽지
                        </Link>
                        <div className="h-px bg-gray-100 my-2"></div>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                handleLogout()
                                setIsMenuOpen(false)
                            }}
                            className="justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
                        >
                            로그아웃
                        </Button>
                    </div>
                )}
            </header>
            <main className="container mx-auto p-6 max-w-6xl">
                {children}
            </main>
        </div>
    )
}
