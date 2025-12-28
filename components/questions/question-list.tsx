'use client'

import { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserRole } from "@/hooks/use-user-role"
import { QuestionForm } from "@/components/questions/question-form"

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
                    <Card key={q.id} className="bg-white border-gray-200 shadow-sm transition-all hover:shadow-md">
                        <CardContent className="p-5 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                            {formatTime(q.timestamp_seconds)}
                                        </span>
                                        {q.status === 'answered' ? (
                                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                                답변완료
                                            </span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200">
                                                검토중
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-base">
                                        {q.title || '제목 없음'}
                                    </h4>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(q.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                                {q.content}
                            </p>

                            {/* Question Image */}
                            {q.image_url && (
                                <div className="mt-3">
                                    <img
                                        src={q.image_url}
                                        alt="Question Attachment"
                                        className="rounded-lg border border-gray-200 max-h-60 object-contain bg-gray-50"
                                    />
                                </div>
                            )}

                            {/* Answer Section */}
                            {q.status === 'answered' && (
                                <div className="bg-blue-50/50 rounded-lg p-4 mt-3 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">T</div>
                                        <span className="text-sm font-bold text-blue-900">선생님 답변</span>
                                    </div>
                                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                        {q.final_answer}
                                    </p>
                                </div>
                            )}

                            {/* Admin Controls */}
                            {isAdmin && answeringId !== q.id && (
                                <Button
                                    onClick={() => startAnswering(q)}
                                    size="sm"
                                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 shadow-sm"
                                >
                                    {q.status === 'answered' ? '답변 수정하기' : '답변 작성하기 (관리자)'}
                                </Button>
                            )}

                            {/* Answer Editor */}
                            {isAdmin && answeringId === q.id && (
                                <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                                        <span>답변 작성</span>
                                        {q.ai_draft_answer && <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded text-[10px]">AI 초안 불러옴</span>}
                                    </div>
                                    <textarea
                                        className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[100px]"
                                        placeholder="답변 내용을 입력하세요..."
                                        value={answerDraft}
                                        onChange={(e) => setAnswerDraft(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="secondary" onClick={cancelAnswering} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">취소</Button>
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md" onClick={() => submitAnswer(q.id)}>
                                            답변 등록
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
