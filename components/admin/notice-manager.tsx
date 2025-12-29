'use client'

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2 } from "lucide-react"

type Notice = {
    id: string
    title: string
    created_at: string
    author: string
}

export function NoticeManager() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [notices, setNotices] = useState<Notice[]>([])
    const supabase = createClient()

    useEffect(() => {
        fetchNotices()
    }, [])

    const fetchNotices = async () => {
        const { data } = await supabase
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setNotices(data)
    }

    const handleAddNotice = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            const res = await fetch('/api/admin/notices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, author: '관리자' })
            })
            const data = await res.json()

            if (res.ok && data.success) {
                setMessage('공지사항이 등록되었습니다.')
                setTitle('')
                setContent('')
                fetchNotices()
            } else {
                setMessage('Error: ' + data.error)
            }
        } catch (e) {
            setMessage('오류 발생')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('삭제하시겠습니까?')) return
        try {
            const res = await fetch('/api/admin/notices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'delete', id })
            })
            if (res.ok) {
                setNotices(prev => prev.filter(n => n.id !== id))
            } else {
                alert('삭제 실패')
            }
        } catch (e) {
            alert('오류 발생')
        }
    }


    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Form */}
            <Card className="glass border-white/10 h-fit">
                <CardHeader>
                    <CardTitle>공지사항 작성</CardTitle>
                    <CardDescription>새로운 공지사항을 등록합니다.</CardDescription>
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

            {/* List */}
            <Card className="glass border-white/10 h-fit">
                <CardHeader>
                    <CardTitle>등록된 공지 목록</CardTitle>
                    <CardDescription>총 {notices.length}개의 공지사항이 있습니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
                        {notices.length === 0 && <div className="text-gray-400 text-center py-10">등록된 공지가 없습니다.</div>}
                        {notices.map(notice => (
                            <div key={notice.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:shadow transition-shadow">
                                <div className="min-w-0">
                                    <div className="font-bold truncate">{notice.title}</div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(notice.created_at).toLocaleDateString()} · {notice.author}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(notice.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
