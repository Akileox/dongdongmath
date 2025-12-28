'use client'

import { useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Upload } from 'lucide-react'

interface QuestionFormProps {
    lectureId: string
    timestamp: number
    onClose: () => void
    userId: string
}

export function QuestionForm({ lectureId, timestamp, onClose, userId }: QuestionFormProps) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Title fallback if empty (though made required)
        const finalTitle = title.trim() || `${formatTime(timestamp)} 질문`

        const { error } = await supabase.from('questions').insert({
            user_id: userId,
            lecture_id: lectureId,
            title: finalTitle,
            content,
            timestamp_seconds: timestamp,
            status: 'pending',
            ai_draft_answer: null,
        })

        if (!error) {
            alert('질문이 등록되었습니다.')
            onClose()
            // In a real app, we'd invalidate queries here
        } else {
            alert('Failed to submit question: ' + error.message)
        }
        setLoading(false)
    }

    return (
        <Card className="w-full max-w-lg bg-white shadow-2xl border-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">질문 작성하기</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-500 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                </Button>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg">
                        <span className="bg-black text-white px-2 py-0.5 rounded text-xs font-bold">Time</span>
                        <span className="font-mono text-lg text-black">{formatTime(timestamp)}</span>
                        <span className="text-gray-400 text-xs ml-auto">현재 재생 시간</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">제목</label>
                        <Input
                            placeholder="질문 제목을 입력해주세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="bg-white border-gray-200 text-black placeholder:text-gray-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">질문 내용</label>
                        <Textarea
                            placeholder="궁금한 내용을 구체적으로 적어주세요."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            className="min-h-[120px] bg-white border-gray-200 text-black placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    {/* Image Upload Placeholder */}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:bg-gray-50 transition-all cursor-pointer group">
                        <Upload size={24} className="mb-2 group-hover:text-black transition-colors" />
                        <span className="text-xs group-hover:text-black transition-colors">이미지(문제/풀이) 첨부하기</span>
                        <input type="file" className="hidden" />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-900 text-white font-bold h-12 rounded-xl text-md shadow-lg transition-transform active:scale-[0.98]">
                        {loading ? '등록 중...' : '질문 등록 완료'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min}:${sec < 10 ? '0' : ''}${sec}`
}
