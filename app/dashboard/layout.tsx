'use client'
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const supabase = createClient()

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
                    <nav className="flex items-center gap-6">
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
                </div>
            </header>
            <main className="container mx-auto p-6 max-w-6xl">
                {children}
            </main>
        </div>
    )
}
