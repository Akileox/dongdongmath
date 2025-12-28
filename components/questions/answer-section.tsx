'use client'

import { useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useUserRole } from "@/hooks/use-user-role"
import { Upload, X } from 'lucide-react'
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

interface Question {
    id: string
    title?: string
    content: string
    timestamp_seconds: number
    status: string
    created_at: string
    ai_draft_answer?: string
    final_answer?: string
    user_id: string
    lecture_id?: string
    lecture_title?: string // Join result if needed
}

export function AnswerSection({ question }: { question: Question }) {
    const { role, user } = useUserRole()
    const isAdmin = role === 'admin' || role === 'assistant'
    const supabase = createClient()

    // Local state for UI updates
    const [status, setStatus] = useState(question.status)
    const [finalAnswer, setFinalAnswer] = useState(question.final_answer || '')

    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState(question.final_answer || question.ai_draft_answer || '')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const startEditing = () => {
        setIsEditing(true)
        setDraft(finalAnswer || question.ai_draft_answer || '')
    }

    const cancelEditing = () => {
        setIsEditing(false)
        setDraft('')
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(true)
            const file = e.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `answer_${question.id}_${Math.random()}.${fileExt}`
            const filePath = `answers/${fileName}` // Storing in 'answers' folder if possible, or root

            // Reuse 'question-images' bucket for simplicity as we know it exists
            const { error: uploadError } = await supabase.storage
                .from('question-images')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('question-images')
                .getPublicUrl(filePath)

            // Append Markdown Image to Draft
            const imageMarkdown = `\n\n![첨부 이미지](${publicUrl})\n`
            setDraft(prev => prev + imageMarkdown)

        } catch (error: any) {
            alert('이미지 업로드 실패: ' + error.message)
        } finally {
            setUploading(false)
            // Reset input
            e.target.value = ''
        }
    }

    const submitAnswer = async () => {
        setLoading(true)

        // Removed automated signature as per user request ("I'll reveal it myself")
        const answerToSave = draft

        const { error } = await supabase.from('questions').update({
            final_answer: answerToSave,
            status: 'answered'
        }).eq('id', question.id)

        if (!error) {
            setFinalAnswer(answerToSave)
            setStatus('answered')
            setIsEditing(false)
        } else {
            alert('답변 등록 실패: ' + error.message)
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            {/* Existing Answer Display */}
            {status === 'answered' && !isEditing && (
                <div className="bg-blue-50/50 rounded-lg p-6 border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">T</div>
                        <span className="font-bold text-blue-900">선생님 답변</span>
                    </div>
                    <div className="text-gray-800">
                        <MarkdownRenderer content={finalAnswer} />
                    </div>
                </div>
            )}

            {/* Empty State for Students */}
            {status !== 'answered' && !isAdmin && (
                <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-400 text-sm">
                    아직 등록된 답변이 없습니다. 선생님의 답변을 기다려주세요.
                </div>
            )}

            {/* Admin Controls */}
            {isAdmin && !isEditing && (
                <Button
                    onClick={startEditing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 shadow-sm"
                >
                    {status === 'answered' ? '답변 수정하기' : '답변 작성하기 (관리자)'}
                </Button>
            )}

            {/* Editor */}
            {isAdmin && isEditing && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200 space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                            <span>답변 작성</span>
                            <span className="text-[10px] text-gray-400 font-normal border border-gray-200 px-1 rounded">Markdown & LaTeX 지원</span>
                        </div>
                        {question.ai_draft_answer && !finalAnswer && <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded text-xs">AI 초안 불러옴</span>}
                    </div>

                    <div className="relative">
                        <textarea
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[200px] font-mono"
                            placeholder={"답변을 입력하세요...\n\n수식 입력: $E=mc^2$ 또는 $$...$$\n이미지는 아래 버튼으로 첨부하세요."}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                        />
                        {/* Toolbar */}
                        <div className="absolute bottom-3 right-3 flex gap-2">
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2 bg-white hover:bg-gray-50 text-xs font-bold border-gray-300"
                                    disabled={uploading}
                                >
                                    <Upload size={14} />
                                    {uploading ? '업로드...' : '이미지 추가'}
                                </Button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={cancelEditing} disabled={loading} className="text-gray-500 hover:text-gray-700">취소</Button>
                        <Button onClick={submitAnswer} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            {loading ? '등록 중...' : '답변 등록 완료'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
