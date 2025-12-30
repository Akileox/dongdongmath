'use client'

import { useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { useRouter } from "next/navigation"

export function LectureManager() {
    const [title, setTitle] = useState('')
    const [section, setSection] = useState('')
    const [youtubeLink, setYoutubeLink] = useState('')
    const [learningGuide, setLearningGuide] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const supabase = createClient()
    const router = useRouter()

    const handleAddLecture = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const { error } = await supabase.from('lectures').insert({
            title,
            section,
            youtube_link: youtubeLink,
            learning_guide: learningGuide,
        })

        if (error) {
            setMessage('Error: ' + error.message)
        } else {
            setMessage('Lecture added successfully!')
            setTitle('')
            setSection('')
            setYoutubeLink('')
            setLearningGuide('')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <Card className="glass border-white/10">
            <CardHeader>
                <CardTitle>새 강의 추가</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddLecture} className="space-y-4">
                    <Input
                        placeholder="강의 제목 (예: 1강 - 지수함수의 뜻)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="bg-white border-gray-200"
                    />
                    <Input
                        placeholder="섹션 (예: 2026 겨울 스파르타 공통수학1)"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        required
                        className="bg-white border-gray-200"
                    />
                    <Input
                        placeholder="YouTube 링크 (URL)"
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        required
                        className="bg-white border-gray-200"
                    />
                    <Textarea
                        placeholder="학습 가이드 (선생님 코멘트, 예습 방법 등)"
                        value={learningGuide}
                        onChange={(e) => setLearningGuide(e.target.value)}
                        className="min-h-[100px] bg-white border-gray-200"
                    />
                    <Button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800 text-white font-bold transition-colors">
                        {loading ? '추가 중...' : '강의 추가하기'}
                    </Button>
                    {message && <p className="text-sm text-gray-400 mt-2">{message}</p>}
                </form>
            </CardContent>
        </Card>
    )
}
