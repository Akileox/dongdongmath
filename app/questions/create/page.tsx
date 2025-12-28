'use client'

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PublicNavbar } from "@/components/layout/public-navbar"

import { Upload, X } from 'lucide-react'

export default function CreateQuestionPage() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setUploading(true)
            const file = e.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('question-images')
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

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('questions').insert({
            title,
            content,
            image_url: imageUrl,
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

                    {/* Image Upload Area */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">이미지 첨부 (선택)</label>
                        {imageUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 group w-full">
                                <img src={imageUrl} alt="Uploaded" className="w-full h-64 object-contain bg-gray-50" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl(null)}
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black text-white p-1 rounded-full transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:bg-gray-50 transition-all cursor-pointer relative">
                                <Upload size={24} className="mb-2 transition-colors" />
                                <span className="text-xs transition-colors">
                                    {uploading ? '업로드 중...' : '이미지(문제/풀이) 클릭하여 업로드'}
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
                            disabled={loading || uploading}
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
