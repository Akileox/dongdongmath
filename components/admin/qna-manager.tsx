'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, CheckCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

type Question = {
    id: string
    title: string
    content: string
    author: string // or author_id and fetch name
    created_at: string
    status: 'pending' | 'answered' | 'closed'
}

export function QnaManager() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchQuestions()
    }, [])

    const fetchQuestions = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setQuestions(data)
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">대기 중인 질문</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{questions.filter(q => q.status === 'pending').length}건</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">답변 완료</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{questions.filter(q => q.status === 'answered').length}건</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" /> 질문 목록
                    </CardTitle>
                    <CardDescription>학생들의 질문을 확인하고 답변을 작성할 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {loading && <div className="text-center py-10 text-gray-400">Loading...</div>}
                        {!loading && questions.length === 0 && <div className="text-center py-10 text-gray-400">질문이 없습니다.</div>}

                        {!loading && questions.map(q => (
                            <div key={q.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={q.status === 'pending' ? 'destructive' : 'default'} className={q.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none' : 'bg-blue-600 text-white hover:bg-blue-700 border-none'}>
                                            {q.status === 'pending' ? '답변 대기' : '답변 완료'}
                                        </Badge>
                                        <span className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString()}</span>
                                        <span className="text-xs text-gray-500 font-bold">{q.author || '학생'}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 truncate">{q.title}</h4>
                                    <p className="text-sm text-gray-500 truncate">{q.content}</p>
                                </div>
                                <Link href={`/questions/${q.id}`}>
                                    <Button variant="outline" size="sm" className="hidden md:flex">
                                        <ExternalLink className="w-4 h-4 mr-2" /> 상세 보기 및 답변
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
