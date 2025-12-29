'use client'

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const supabase = createClient()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

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
