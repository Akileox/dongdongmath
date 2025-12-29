'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

export function PublicNavbar() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }
        checkUser()
    }, [])

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false)
    }, [])

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-xl font-bold tracking-tight text-black font-sans">
                        DONGDONG MATH
                    </Link>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex gap-6 text-sm font-medium text-gray-600">
                        <Link href="/notices" className="hover:text-black transition-colors font-sans">공지사항</Link>
                        <Link href="/intro" className="hover:text-black transition-colors font-sans">서비스 소개</Link>
                        <Link href="/questions" className="hover:text-black transition-colors font-sans">질문게시판</Link>
                    </div>
                    <div>
                        {loading ? (
                            <div className="w-16 h-9" />
                        ) : user ? (
                            (user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'assistant') ? (
                                <Link href="/admin">
                                    <Button className="bg-blue-600 text-white hover:bg-blue-700 font-bold transition-colors">관리자 대시보드</Button>
                                </Link>
                            ) : (
                                <Link href="/dashboard">
                                    <Button className="bg-black text-white hover:bg-gray-800 font-bold transition-colors">내 강의실</Button>
                                </Link>
                            )
                        ) : (
                            <Link href="/login">
                                <Button variant="ghost" className="text-gray-900 font-semibold hover:bg-gray-100">로그인</Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="md:hidden flex items-center gap-4">
                    {/* Show 'My Class' or 'Admin' button on mobile if logged in, but compact */}
                    {!loading && user && (
                        (user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'assistant') ? (
                            <Link href="/admin">
                                <Button size="sm" className="bg-blue-600 text-white text-xs">관리자</Button>
                            </Link>
                        ) : (
                            <Link href="/dashboard">
                                <Button size="sm" className="bg-black text-white text-xs">내 강의실</Button>
                            </Link>
                        )
                    )}
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600">
                        {isMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-2">
                    <Link href="/notices" className="p-2 hover:bg-gray-50 rounded-md font-medium" onClick={() => setIsMenuOpen(false)}>공지사항</Link>
                    <Link href="/intro" className="p-2 hover:bg-gray-50 rounded-md font-medium" onClick={() => setIsMenuOpen(false)}>서비스 소개</Link>
                    <Link href="/questions" className="p-2 hover:bg-gray-50 rounded-md font-medium" onClick={() => setIsMenuOpen(false)}>질문게시판</Link>
                    {!loading && !user && (
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                            <Button className="w-full mt-2" variant="outline">로그인</Button>
                        </Link>
                    )}
                </div>
            )}
        </nav>
    )
}
