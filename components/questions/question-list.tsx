'use client'

import { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserRole } from "@/hooks/use-user-role"
import { QuestionForm } from "@/components/questions/question-form"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import Link from 'next/link'

// Simulated Badge
const BadgeSim = ({ children, variant }: { children: React.ReactNode, variant: 'default' | 'secondary' | 'outline' | 'success' }) => {
    let colorClass = "bg-gray-500/20 text-gray-300"
    if (variant === 'success') colorClass = "bg-green-500/20 text-green-400 border-green-500/30"
    if (variant === 'default') colorClass = "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"

    return <span className={`px-2 py-0.5 rounded text-xs border border-transparent ${colorClass}`}>{children}</span>
}

interface Question {
    id: string
    title?: string // Added title
    content: string
    timestamp_seconds: number
    status: string
    created_at: string
    ai_draft_answer?: string
    final_answer?: string
    user_id: string
    image_url?: string // Added image_url
}

export function QuestionList({ lectureId, initialTimestamp, onClearTimestamp }: { lectureId: string, initialTimestamp?: number, onClearTimestamp?: () => void }) {
    const [isCreating, setIsCreating] = useState(false)
    const [initialTime, setInitialTime] = useState(0)
    const [questions, setQuestions] = useState<Question[]>([])
    const { role, user, loading } = useUserRole()
    const isAdmin = role === 'admin' || role === 'assistant'
    const supabase = createClient()
    const [answeringId, setAnsweringId] = useState<string | null>(null)
    const [answerDraft, setAnswerDraft] = useState('')

    // Trigger Creation when initialTimestamp prop changes (from parent)
    useEffect(() => {
        if (typeof initialTimestamp === 'number' && initialTimestamp >= 0) {
            setInitialTime(initialTimestamp)
            setIsCreating(true)
        }
    }, [initialTimestamp])

    const startCreating = () => {
        setInitialTime(0) // Default
        setIsCreating(true)
    }

    const handleCloseForm = () => {
        setIsCreating(false)
        if (onClearTimestamp) onClearTimestamp()
    }

    useEffect(() => {
        const fetchQuestions = async () => {
            const { data } = await supabase
                .from('questions')
                .select('*')
                .eq('lecture_id', lectureId)
                .order('created_at', { ascending: false })

            if (data) setQuestions(data)
        }

        fetchQuestions()

        const channel = supabase.channel('questions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `lecture_id=eq.${lectureId}` }, (payload) => {
                fetchQuestions()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [lectureId, supabase])

    const startAnswering = (q: Question) => {
        setAnsweringId(q.id)
        setAnswerDraft(q.final_answer || q.ai_draft_answer || '')
    }

    const cancelAnswering = () => {
        setAnsweringId(null)
        setAnswerDraft('')
    }

    const submitAnswer = async (qId: string) => {
        const { error } = await supabase.from('questions').update({
            final_answer: answerDraft,
            status: 'answered'
        }).eq('id', qId)

        if (!error) {
            cancelAnswering()
        } else {
            alert('Error submitting answer: ' + error.message)
        }
    }

    if (loading) return <div className="text-gray-400 text-sm">Loading q&a...</div>

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <h3 className="text-lg font-bold text-gray-900">질문 목록</h3>
                {!isCreating && (
                    <Button onClick={startCreating} className="bg-black hover:bg-gray-800 text-white font-bold text-xs h-8">
                        직접 질문 작성
                    </Button>
                )}
            </div>

            {/* Inline Question Form */}
            {isCreating && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                    <QuestionForm
                        lectureId={lectureId}
                        timestamp={initialTime}
                        userId={user!.id}
                        onClose={handleCloseForm}
                    />
                </div>
            )}

            <div className="flex-1 space-y-4 pb-4">
                {questions.length === 0 && !isCreating && (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">아직 등록된 질문이 없습니다.</p>
                        <p className="text-gray-300 text-xs mt-1">첫 번째 질문을 남겨보세요!</p>
                    </div>
                )}

                {questions.map((q) => (
                    <Link href={`/questions/${q.id}`} key={q.id} className="block group">
                        <Card className="bg-white border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-blue-200 cursor-pointer">
                            <CardContent className="p-5 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                {formatTime(q.timestamp_seconds)}
                                            </span>
                                            {q.status === 'answered' ? (
                                                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-transparent">
                                                    답변완료
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200">
                                                    검토중
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
                                            {q.title || '제목 없음'}
                                        </h4>
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {new Date(q.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg line-clamp-2">
                                    {q.content}
                                </p>

                                {/* Question Image Thumbnail */}
                                {q.image_url && (
                                    <div className="mt-2">
                                        <div className="h-20 w-20 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden relative">
                                            <img
                                                src={q.image_url}
                                                alt="Attachment"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Answer Preview (Read-Only) */}
                                {q.status === 'answered' && (
                                    <div className="bg-blue-50/50 rounded-lg p-3 mt-3 border border-blue-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">T</div>
                                            <span className="text-xs font-bold text-blue-900">선생님 답변</span>
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2">
                                            (상세보기에서 확인하세요)
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}

function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min}:${sec < 10 ? '0' : ''}${sec}`
}
