'use client'

import { useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NoticeManager() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const supabase = createClient()

    const handleAddNotice = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const { error } = await supabase.from('notices').insert({
            title,
            content,
            author: '관리자' // Or fetch user name
        })

        if (error) {
            setMessage('Error: ' + error.message)
        } else {
            setMessage('공지사항이 등록되었습니다.')
            setTitle('')
            setContent('')
        }
        setLoading(false)
    }

    return (
        <Card className="glass border-white/10">
            <CardHeader>
                <CardTitle>공지사항 작성</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddNotice} className="space-y-4">
                    <Input
                        placeholder="공지 제목"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="bg-white border-gray-200"
                    />
                    <Textarea
                        placeholder="공지 내용 (HTML 태그 사용 가능)"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        className="min-h-[200px] bg-white border-gray-200"
                    />
                    <Button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800 text-white font-bold transition-colors">
                        {loading ? '등록 중...' : '공지 등록하기'}
                    </Button>
                    {message && <p className="text-sm text-gray-500 mt-2">{message}</p>}
                </form>
            </CardContent>
        </Card>
    )
}
