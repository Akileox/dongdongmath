'use client'

import { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { useUserRole } from "@/hooks/use-user-role"

// Reusing types or defining them
interface Question {
    id: string
    title?: string
    content: string
    timestamp_seconds: number
    status: string
    created_at: string
    author?: string
    user_id: string
}

export function QuestionBoard() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [filter, setFilter] = useState<'all' | 'mine'>('all')
    const [loading, setLoading] = useState(true)
    const { user } = useUserRole() // Hook to get current user
    const supabase = createClient()

    useEffect(() => {
        fetchQuestions()
    }, [user, filter]) // Re-fetch or re-filter when user or filter changes

    const fetchQuestions = async () => {
        setLoading(true)
        let query = supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false })

        if (filter === 'mine' && user) {
            query = query.eq('user_id', user.id)
        }

        const { data } = await query
        if (data) setQuestions(data)
        setLoading(false)
    }

    return (
        <div className="w-full">
            {/* Filter Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-colors ${filter === 'all' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    전체 질문
                </button>
                {user && (
                    <button
                        onClick={() => setFilter('mine')}
                        className={`pb-2 text-sm font-bold border-b-2 transition-colors ${filter === 'mine' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        내가 한 질문
                    </button>
                )}
            </div>

            {/* List Header */}
            <div className="flex justify-between items-center py-3 border-b-2 border-gray-900 text-sm font-bold text-gray-900">
                <span className="w-24 text-center">작성일</span>
                <span className="flex-1 text-center">제목</span>
                <span className="w-24 text-center">작성자</span>
                <span className="w-24 text-center">답변여부</span>
            </div>

            {/* Loading / Empty States */}
            {loading && <div className="py-12 text-center text-gray-400">로딩 중...</div>}

            {!loading && questions.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                    {filter === 'mine' ? '작성한 질문이 없습니다.' : '등록된 질문이 없습니다.'}
                </div>
            )}

            {/* List Items */}
            {!loading && questions.map((q) => (
                <Link href={`/questions/${q.id}`} key={q.id} className="block">
                    <div className="flex justify-between items-center py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer text-sm">
                        <span className="w-24 text-center text-gray-500">
                            {new Date(q.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex-1 px-4 font-normal text-gray-900 flex items-center gap-2">
                            {q.status === 'answered' && <span className="text-xs">🔒</span>}
                            {q.title}
                            {q.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1 rounded">N</span>}
                        </span>
                        <span className="w-24 text-center text-gray-500">{q.author || '학생'}</span>
                        <span className={`w-24 text-center ${q.status === 'answered' ? 'text-orange-500' : 'text-gray-400'}`}>
                            {q.status === 'answered' ? '답변 완료' : '답변 대기'}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    )
}
