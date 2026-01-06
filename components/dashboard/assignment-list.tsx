'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react"

type AssignmentSubmission = {
    id: string
    status: 'pending' | 'submitted' | 'graded'
    grade: string | null
    feedback: string | null
    created_at: string
    assignment: {
        id: string
        title: string
        description: string | null
        due_date: string | null
    }
}

export function AssignmentList() {
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('assignment_submissions')
                .select(`
                    *,
                    assignment:assignments(id, title, description, due_date)
                `)
                .eq('student_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setSubmissions(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (id: string, newStatus: 'submitted' | 'pending') => {
        try {
            // Optimistic update
            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))

            const { error } = await supabase
                .from('assignment_submissions')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error(error)
            fetchAssignments() // Revert
        }
    }

    if (loading) return <div className="p-4 text-center text-sm text-gray-500">로딩중...</div>
    if (submissions.length === 0) return <div className="p-4 text-center text-sm text-gray-500">할당된 과제가 없습니다.</div>

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    나의 과제
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {submissions.map((sub) => {
                        const isLate = sub.assignment.due_date && new Date(sub.assignment.due_date) < new Date() && sub.status === 'pending'

                        return (
                            <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{sub.assignment.title}</span>
                                        {sub.status === 'graded' && sub.grade && (
                                            <Badge variant="secondary" className={
                                                sub.grade === 'A' ? "bg-green-100 text-green-800" :
                                                    sub.grade === 'B' ? "bg-blue-100 text-blue-800" :
                                                        sub.grade === 'C' ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                                            }>
                                                {sub.grade}등급
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 line-clamp-1">
                                        {sub.assignment.description}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        {sub.assignment.due_date && (
                                            <span className={`flex items-center gap-1 ${isLate ? "text-red-500 font-bold" : ""}`}>
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(sub.assignment.due_date), "M/d")} 마감
                                            </span>
                                        )}
                                        {sub.assignment.due_date && isLate && <span>(지각)</span>}
                                    </div>
                                    {sub.feedback && (
                                        <div className="text-sm bg-white p-2 rounded border border-blue-100 text-blue-800 mt-1">
                                            <span className="font-bold mr-1">Tutor:</span> {sub.feedback}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-shrink-0">
                                    {sub.status === 'graded' ? (
                                        <Badge className="bg-gray-600">채점 완료</Badge>
                                    ) : sub.status === 'submitted' ? (
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 px-4 rounded-full" onClick={() => handleStatusChange(sub.id, 'pending')}>
                                            제출 완료
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 font-bold h-8 px-4 rounded-full" onClick={() => handleStatusChange(sub.id, 'submitted')}>
                                            제출하기
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
