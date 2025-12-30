'use client'

import { useState, useRef } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useUserRole } from "@/hooks/use-user-role"
import { Upload, X, Bold, Italic, List, Heading1, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { VideoPreview } from "@/components/ui/video-preview"

interface Question {
    id: string
    title?: string
    content: string
    timestamp_seconds: number
    status: string
    created_at: string
    ai_draft_answer?: string
    answer?: string
    user_id: string
    lecture_id?: string
    lecture_title?: string
    video_url?: string
    answer_video_url?: string
}

export function AnswerSection({ question }: { question: Question }) {
    console.log('AnswerSection Question Prop:', question)
    const { role, user } = useUserRole()
    const isAdmin = role === 'admin' || role === 'assistant'
    const supabase = createClient()
    const router = useRouter()

    // Local state for UI updates
    const [status, setStatus] = useState(question.status)
    const [finalAnswer, setFinalAnswer] = useState(question.answer || '')
    const [answerVideoUrl, setAnswerVideoUrl] = useState<string | null>(question.answer_video_url || null)

    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState(question.answer || question.ai_draft_answer || '')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const insertFormat = (prefix: string, suffix: string) => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = draft
        const before = text.substring(0, start)
        const selection = text.substring(start, end)
        const after = text.substring(end)

        const newText = before + prefix + selection + suffix + after
        setDraft(newText)

        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + prefix.length, end + prefix.length)
        }, 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') {
                e.preventDefault()
                insertFormat('**', '**')
            } else if (e.key === 'i') {
                e.preventDefault()
                insertFormat('*', '*')
            }
        }
    }

    const startEditing = () => {
        setIsEditing(true)
        setDraft(finalAnswer || question.ai_draft_answer || '')
        setAnswerVideoUrl(question.answer_video_url || null)
    }

    const cancelEditing = () => {
        setIsEditing(false)
        setDraft('')
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(true)
            const file = e.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `answer_${question.id}_${Math.random()}.${fileExt}`
            const filePath = `answers/${fileName}`
            const isVideo = file.type.startsWith('video/')

            // Reuse 'question-images' bucket for simplicity
            const { error: uploadError } = await supabase.storage
                .from('question-images')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('question-images')
                .getPublicUrl(filePath)

            if (isVideo) {
                setAnswerVideoUrl(publicUrl)
                // Optionally append text to draft saying "[Video Attached]"? 
                // No, UI handles it separately.
            } else {
                // Append Markdown Image to Draft
                const imageMarkdown = `\n\n![첨부 이미지](${publicUrl})\n`
                setDraft(prev => prev + imageMarkdown)
            }

        } catch (error: any) {
            alert('파일 업로드 실패: ' + error.message)
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const submitAnswer = async () => {
        setLoading(true)

        const answerToSave = draft

        const { data, error } = await supabase.from('questions').update({
            answer: answerToSave,
            answer_video_url: answerVideoUrl, // Save video URL
            status: 'answered'
        }).eq('id', question.id).select()

        console.log('Update Result:', { data, error })

        if (!error && data && data.length > 0) {
            setFinalAnswer(answerToSave)
            setStatus('answered')
            setIsEditing(false)
            router.refresh() // Refresh server data
        } else {
            console.error('Update failed:', error || 'No rows updated')
            alert('답변 등록 실패: ' + (error?.message || '권한이 없거나 해당 질문을 찾을 수 없습니다.'))
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
                    {/* Display Answer Video */}
                    {answerVideoUrl && (
                        <div className="mt-4 max-w-lg">
                            <VideoPreview src={answerVideoUrl} />
                        </div>
                    )}
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
                <div className="flex gap-2">
                    <Button
                        onClick={startEditing}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 shadow-sm"
                    >
                        {status === 'answered' ? '답변 수정하기' : '답변 작성하기 (관리자)'}
                    </Button>
                    {status === 'answered' && (
                        <Button
                            onClick={async () => {
                                if (!confirm('정말로 답변을 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.')) return

                                setLoading(true)
                                const { error } = await supabase.from('questions').update({
                                    answer: null,
                                    answer_video_url: null,
                                    status: 'pending'
                                }).eq('id', question.id)

                                if (!error) {
                                    setStatus('pending')
                                    setFinalAnswer('')
                                    setAnswerVideoUrl(null)
                                    router.refresh()
                                } else {
                                    alert('삭제 실패: ' + error.message)
                                }
                                setLoading(false)
                            }}
                            variant="destructive"
                            className="w-24 font-bold h-10 shadow-sm"
                            disabled={loading}
                        >
                            삭제
                        </Button>
                    )}
                </div>
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

                    {/* Toolbar */}
                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <Button variant="ghost" size="sm" onClick={() => insertFormat('**', '**')} className="h-7 w-7 p-0 hover:bg-white" title="굵게 (Ctrl+B)">
                            <Bold size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => insertFormat('*', '*')} className="h-7 w-7 p-0 hover:bg-white" title="기울임 (Ctrl+I)">
                            <Italic size={14} />
                        </Button>
                        <div className="w-px h-4 bg-gray-300 mx-1" />
                        <Button variant="ghost" size="sm" onClick={() => insertFormat('# ', '')} className="h-7 w-7 p-0 hover:bg-white" title="제목 1">
                            <Heading1 size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => insertFormat('- ', '')} className="h-7 w-7 p-0 hover:bg-white" title="리스트">
                            <List size={14} />
                        </Button>
                    </div>

                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[200px] font-mono"
                            placeholder={"답변을 입력하세요...\n\n수식 입력: $E=mc^2$ 또는 $$...$$\n이미지는 아래 버튼으로 첨부하세요."}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />

                        {/* Video Preview in Editor */}
                        {answerVideoUrl && (
                            <div className="mt-2 max-w-sm">
                                <VideoPreview
                                    src={answerVideoUrl}
                                    onRemove={() => setAnswerVideoUrl(null)}
                                    editable
                                />
                            </div>
                        )}

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
                                    {uploading ? '업로드...' : '이미지/동영상 추가'}
                                </Button>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileUpload}
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
