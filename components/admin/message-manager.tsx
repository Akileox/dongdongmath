'use client'

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Search, Send, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"

type Message = {
    id: string
    content: string
    created_at: string
    receiver_id: string
    receiver?: {
        full_name: string
        class_section: string
    }
    is_read: boolean
}

type Student = {
    id: string
    full_name: string
    class_section: string
}

export function MessageManager() {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [students, setStudents] = useState<Student[]>([])
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [sentMessages, setSentMessages] = useState<Message[]>([])
    const supabase = createClient()

    useEffect(() => {
        fetchStudents()
        fetchSentMessages()
    }, [])

    const fetchStudents = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, class_section')
            .eq('role', 'student')
            .order('full_name')
        if (data) setStudents(data)
    }

    const fetchSentMessages = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('messages')
            .select(`
                *,
                *,
                receiver:profiles!messages_receiver_id_fkey (
                    full_name,
                    class_section
                )
            `)
            .eq('sender_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) setSentMessages(data)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStudent || !content.trim()) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: user?.id,
                    receiver_id: selectedStudent.id,
                    content: content
                })

            if (error) throw error

            alert('쪽지가 전송되었습니다.')
            setContent('')
            setSelectedStudent(null)
            setSearchQuery('')
            fetchSentMessages()
        } catch (e: any) {
            alert('전송 실패: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    // Filter students for search
    const filteredStudents = students.filter(s =>
        s.full_name.includes(searchQuery) ||
        (s.class_section && s.class_section.includes(searchQuery))
    )

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Send Form */}
            <Card className="h-fit">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600" />
                        쪽지 보내기
                    </CardTitle>
                    <CardDescription>학생에게 개별 쪽지를 발송합니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Student Search/Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">받는 사람</label>
                            {!selectedStudent ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            placeholder="학생 이름 또는 반 검색..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    {searchQuery && (
                                        <div className="border rounded-md max-h-[200px] overflow-y-auto bg-white shadow-sm mt-1">
                                            {filteredStudents.length === 0 ? (
                                                <div className="p-3 text-sm text-gray-500 text-center">검색 결과가 없습니다.</div>
                                            ) : (
                                                filteredStudents.map(student => (
                                                    <button
                                                        key={student.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedStudent(student)
                                                            setSearchQuery('')
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between items-center"
                                                    >
                                                        <span className="font-medium">{student.full_name}</span>
                                                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{student.class_section || '미지정'}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-600 p-1 rounded-full">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </span>
                                        <span className="font-bold text-gray-900">{selectedStudent.full_name}</span>
                                        <span className="text-xs text-gray-500">{selectedStudent.class_section}</span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedStudent(null)}
                                        className="text-xs text-gray-400 hover:text-red-500 underline"
                                    >
                                        변경
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">내용</label>
                            <Textarea
                                placeholder="전달할 내용을 입력하세요..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[150px] resize-none bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        <Button
                            onClick={handleSendMessage}
                            disabled={loading || !selectedStudent || !content.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? '전송 중...' : '쪽지 보내기'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* History List */}
            <Card className="h-fit">
                <CardHeader>
                    <CardTitle>보낸 쪽지함</CardTitle>
                    <CardDescription>최근 50건의 발송 내역입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {sentMessages.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                보낸 쪽지 내역이 없습니다.
                            </div>
                        ) : (
                            sentMessages.map(msg => (
                                <div key={msg.id} className="p-4 bg-white border rounded-lg shadow-sm hover:border-blue-200 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">To. {msg.receiver?.full_name || '알 수 없음'}</span>
                                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {msg.receiver?.class_section || '-'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded">
                                        {msg.content}
                                    </div>
                                    <div className="mt-2 flex justify-end">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${msg.is_read ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {msg.is_read ? '읽음' : '읽지 않음'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
