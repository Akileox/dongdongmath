'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export default function InboxPage() {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchMessages()
    }, [])

    const fetchMessages = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('receiver_id', user.id) // Only received messages for now
            .order('created_at', { ascending: false })

        if (data) {
            setMessages(data)
            // Mark as read (simple version: mark all on open)
            // Ideally should mark individually or only unread ones
        }
        setLoading(false)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">쪽지함</h1>

            <div className="space-y-4">
                {loading ? (
                    <div>로딩 중...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg text-gray-500">
                        받은 쪽지가 없습니다.
                    </div>
                ) : (
                    messages.map((m) => (
                        <Card key={m.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-900">시스템/선생님</span>
                                    <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {m.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
