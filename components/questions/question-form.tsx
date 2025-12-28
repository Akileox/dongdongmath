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
    const [lectureTitle, setLectureTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const supabase = createClient()

    // Fetch Lecture Title on Mount
    useState(() => {
        const fetchLectureTitle = async () => {
            const { data } = await supabase.from('lectures').select('title').eq('id', lectureId).single()
            if (data) {
                setLectureTitle(data.title)
                // Auto-set title prefix if empty
                if (!title) setTitle(`[${data.title}] 질문있습니다`)
            }
        }
        fetchLectureTitle()
    })

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(true)
            const file = e.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${userId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('question-images') // Make sure this bucket exists
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('question-images')
                .getPublicUrl(filePath)

            setImageUrl(publicUrl)
        } catch (error: any) {
            alert('이미지 업로드 실패: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const finalTitle = title.trim() || `${formatTime(timestamp)} 질문`

        const { error } = await supabase.from('questions').insert({
            user_id: userId,
            lecture_id: lectureId,
            title: finalTitle,
            content,
            image_url: imageUrl, // Insert Image URL
            timestamp_seconds: timestamp,
            status: 'pending',
            ai_draft_answer: null,
        })

        if (!error) {
            alert('질문이 등록되었습니다.')
            onClose()
        } else {
            alert('Failed to submit question: ' + error.message)
        }
        setLoading(false)
    }

    return (
        <Card className="w-full max-w-lg bg-white shadow-2xl border-0 flex flex-col max-h-[calc(100%-2rem)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3 flex-shrink-0">
                <div className="flex flex-col">
                    <CardTitle className="text-lg font-bold text-gray-900">질문 작성하기</CardTitle>
                    {lectureTitle && <span className="text-xs text-blue-600 font-bold mt-0.5">{lectureTitle}</span>}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-500 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                </Button>
            </CardHeader>
            <CardContent className="pt-4 overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold">Time</span>
                        <span className="font-mono text-base text-black">{formatTime(timestamp)}</span>
                        <span className="text-gray-400 text-xs ml-auto">현재 재생 시간</span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">제목</label>
                        <Input
                            placeholder="질문 제목을 입력해주세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="bg-white border-gray-200 text-black placeholder:text-gray-400 h-9 text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">질문 내용</label>
                        <Textarea
                            placeholder="궁금한 내용을 적어주세요."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            className="min-h-[80px] bg-white border-gray-200 text-black placeholder:text-gray-400 resize-none text-sm"
                        />
                    </div>

                    {/* Image Upload Area */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">이미지 첨부 (선택)</label>
                        {imageUrl ? (
                            <div className="relative rounded-lg overflow-hidden border border-gray-200 group">
                                <img src={imageUrl} alt="Uploaded" className="w-full h-32 object-contain bg-gray-50" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl(null)}
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black text-white p-1 rounded-full transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="border border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:bg-gray-50 transition-all cursor-pointer relative bg-gray-50/50">
                                <Upload size={20} className="mb-1 transition-colors" />
                                <span className="text-[10px] transition-colors">
                                    {uploading ? '업로드 중...' : '이미지 첨부하기'}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        )}
                    </div>

                    <Button type="submit" disabled={loading || uploading} className="w-full bg-black hover:bg-gray-900 text-white font-bold h-10 rounded-lg text-sm shadow-md mt-2">
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
