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

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-xl font-bold tracking-tight text-black font-sans">
                        DONGDONG MATH
                    </Link>
                </div>
                <div className="flex items-center gap-8">
                    <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                        <Link href="/notices" className="hover:text-black transition-colors font-sans">공지사항</Link>
                        <Link href="/intro" className="hover:text-black transition-colors font-sans">서비스 소개</Link>
                        <Link href="/questions" className="hover:text-black transition-colors font-sans">질문게시판</Link>
                    </div>
                    <div>
                        {loading ? (
                            <div className="w-16 h-9" /> // Phantom spacer to prevent layout shift
                        ) : user ? (
                            <Link href="/dashboard">
                                <Button className="bg-black text-white hover:bg-gray-800 font-bold transition-colors">내 강의실</Button>
                            </Link>
                        ) : (
                            <Link href="/login">
                                <Button variant="ghost" className="text-gray-900 font-semibold hover:bg-gray-100">로그인</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
