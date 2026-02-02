'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Send } from "lucide-react"

export function DMManager() {
    const [students, setStudents] = useState<any[]>([])
    const [selectedStudentId, setSelectedStudentId] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        fetchStudents()
        // Subscribe to messages? For now, just fetch on select.
    }, [])

    useEffect(() => {
        if (selectedStudentId) {
            fetchHistory(selectedStudentId)
        }
    }, [selectedStudentId])

    const fetchStudents = async () => {
        const res = await fetch('/api/admin/students')
        const { profiles } = await res.json()
        if (profiles) {
            setStudents(profiles.filter((p: any) => p.role === 'student').sort((a: any, b: any) => (a.full_name || '').localeCompare(b.full_name || '')))
        }
    }

    const fetchHistory = async (studentId: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: true }) // Oldest first for chat view

        if (data) {
            // Filter specifically for this conversation (me <-> student)
            const conversation = data.filter(m =>
                (m.sender_id === user.id && m.receiver_id === studentId) ||
                (m.sender_id === studentId && m.receiver_id === user.id)
            )
            setHistory(conversation)
        }
    }

    const handleSend = async () => {
        if (!selectedStudentId || !message.trim()) return
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: selectedStudentId,
                    content: message.trim()
                })

            if (error) throw error

            setMessage('')
            fetchHistory(selectedStudentId)
            alert('메시지가 전송되었습니다.')
        } catch (e) {
            console.error(e)
            alert('전송 실패')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="glass border-white/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    1:1 메시지 (DM)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Student Selector */}
                <div>
                    <label className="text-sm font-medium mb-1 block">수신자 선택</label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="학생 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            {students.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.full_name} ({s.class_section || '미배정'})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Chat History Area (Optional but good UX) */}
                {selectedStudentId && (
                    <div className="border rounded-md p-4 bg-gray-50 h-[300px] overflow-y-auto space-y-3">
                        {history.length === 0 ? (
                            <div className="text-center text-gray-400 py-10">이전 대화 내역이 없습니다.</div>
                        ) : (
                            history.map(m => {
                                const isMe = m.sender_id !== selectedStudentId // If sender is NOT the selected student, it's me (admin)
                                return (
                                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                                            {m.content}
                                            <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(m.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}

                {/* Input Area */}
                <div className="flex gap-2">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="메시지 내용을 입력하세요..."
                        className="resize-none h-[80px]"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={loading || !selectedStudentId}
                        className="h-[80px] w-[80px]"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
