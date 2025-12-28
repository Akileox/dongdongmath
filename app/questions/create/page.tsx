'use client'

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PublicNavbar } from "@/components/layout/public-navbar"

export default function CreateQuestionPage() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Auth Check
    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('로그인이 필요한 서비스입니다.')
                router.push('/login')
            }
        }
        checkAuth()
    }, [router, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('questions').insert({
            title,
            content,
            author: user.user_metadata.name || '학생', // Fallback
            user_id: user.id
        })

        if (error) {
            alert('Error: ' + error.message)
        } else {
            alert('질문이 등록되었습니다.')
            router.push('/questions')
        }
        setLoading(false)
    }

    return (
        <main className="min-h-screen bg-white text-gray-900 font-sans">
            <PublicNavbar />
            <div className="pt-32 container mx-auto px-6 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">질문 작성하기</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">제목</label>
                        <Input
                            placeholder="질문 제목을 입력하세요 (예: 5강 3번 문제가 이해 안돼요)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="bg-white border-gray-300 focus:border-black focus:ring-black"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">내용</label>
                        <Textarea
                            placeholder="구체적으로 설명해주시면 더 정확한 답변이 가능합니다."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            className="min-h-[300px] bg-white border-gray-300 focus:border-black focus:ring-black"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                            className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold border-0"
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 bg-black text-white hover:bg-gray-900 font-bold shadow-lg transition-transform active:scale-[0.98]"
                        >
                            {loading ? '등록 중...' : '등록하기'}
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    )
}
