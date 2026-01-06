'use client'

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // Assuming these exist, waiting for lint check
import { format } from "date-fns"
import { Calendar as CalendarIcon, Save, ArrowLeft } from "lucide-react"
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"

// Since we have lint errors about missing UI components like popover/calendar in other files, 
// I'll try to use standard inputs if I can't confirm they work, 
// BUT the user previously asked for native date input in assignment manager. 
// I will use native date input here too for consistency and stability.

export default function LearningLogsPage() {
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [sections, setSections] = useState<string[]>([])
    const [selectedSection, setSelectedSection] = useState<string>('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [existingLogId, setExistingLogId] = useState<string | null>(null)
    const [recentLogs, setRecentLogs] = useState<any[]>([])

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetchSections()
        fetchRecentLogs()
    }, [])

    useEffect(() => {
        if (date && selectedSection) {
            fetchLogForDateAndSection(date, selectedSection)
        } else {
            setContent('')
            setExistingLogId(null)
        }
    }, [date, selectedSection])

    const fetchSections = async () => {
        // Fetch unique sections from lectures
        const { data } = await supabase.from('lectures').select('section')
        if (data) {
            const uniqueSections = Array.from(new Set(data.map(l => l.section))).sort()
            setSections(uniqueSections)
            if (uniqueSections.length > 0) setSelectedSection(uniqueSections[0])
        }
    }

    const fetchRecentLogs = async () => {
        const { data } = await supabase
            .from('learning_logs')
            .select('*')
            .order('log_date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(10)

        if (data) setRecentLogs(data)
    }

    const fetchLogForDateAndSection = async (d: string, s: string) => {
        setLoading(true)
        const { data } = await supabase
            .from('learning_logs')
            .select('*')
            .eq('log_date', d)
            .eq('section_name', s)
            .single()

        if (data) {
            setContent(data.content)
            setExistingLogId(data.id)
        } else {
            setContent('')
            setExistingLogId(null)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!selectedSection || !date || !content.trim()) {
            alert('모든 필드를 입력해 주세요.')
            return
        }

        setLoading(true)
        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) throw new Error('Not authenticated')

            if (existingLogId) {
                // Update
                const { error } = await supabase
                    .from('learning_logs')
                    .update({
                        content: content,
                        created_by: user.id
                    })
                    .eq('id', existingLogId)
                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase
                    .from('learning_logs')
                    .insert({
                        section_name: selectedSection,
                        log_date: date,
                        content: content,
                        created_by: user.id
                    })
                if (error) throw error
            }
            alert('저장되었습니다.')
            fetchRecentLogs()
            fetchLogForDateAndSection(date, selectedSection) // Refresh state
        } catch (e: any) {
            console.error(e)
            alert('저장 실패: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()} className="-ml-2">
                        <ArrowLeft className="w-5 h-5 mr-1" /> 돌아가기
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">학습 결과 관리 (일일 리포트)</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Input Area */}
                    <Card className="md:col-span-2 border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle>학습 내용 작성</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Date & Section Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">날짜 선택</label>
                                    <input
                                        type="date"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">분반 선택</label>
                                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="분반을 선택하세요" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    학습 코멘트 (여러 줄 작성 가능)
                                </label>
                                <Textarea
                                    className="min-h-[200px] resize-none text-base leading-relaxed p-4"
                                    placeholder="예시:
- 오늘 삼각함수 활용 파트 진도를 나갔습니다.
- 예제 3번 유형을 특히 어려워하여 추가 설명했습니다.
- 과제 이행도가 매우 우수합니다."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                                    <Save className="w-4 h-4 mr-2" />
                                    {loading ? '저장 중...' : existingLogId ? '수정하기' : '등록하기'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Logs List */}
                    <Card className="border-none shadow-sm bg-gray-100/50">
                        <CardHeader>
                            <CardTitle className="text-base text-gray-600">최근 등록된 리포트</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentLogs.length === 0 && <div className="text-sm text-gray-400 text-center py-4">등록된 내용이 없습니다.</div>}
                                {recentLogs.map(log => (
                                    <div
                                        key={log.id}
                                        className="bg-white p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                                        onClick={() => {
                                            setDate(log.log_date)
                                            setSelectedSection(log.section_name)
                                        }}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-800 text-sm">{log.section_name}</span>
                                            <span className="text-xs text-gray-500">{new Date(log.log_date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2">{log.content}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
