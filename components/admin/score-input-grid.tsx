'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Plus, Save, Calendar as CalendarIcon } from "lucide-react"

type Exam = {
    id: string
    title: string
    exam_date: string
    category: string
    total_score: number
}

type StudentScore = {
    student_id: string
    student_name: string
    grade?: string
    school?: string
    score: number | ''
    rank?: number
    feedback?: string
}

export function ScoreInputGrid() {
    const [exams, setExams] = useState<Exam[]>([])
    const [selectedExamId, setSelectedExamId] = useState<string>('')
    const [scores, setScores] = useState<StudentScore[]>([])
    const [loading, setLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // New Exam Form
    const [newExamTitle, setNewExamTitle] = useState('')
    const [newExamDate, setNewExamDate] = useState(new Date().toISOString().split('T')[0])
    const supabase = createClient()

    useEffect(() => {
        fetchExams()
    }, [])

    useEffect(() => {
        if (selectedExamId) {
            fetchScores(selectedExamId)
        }
    }, [selectedExamId])

    const fetchExams = async () => {
        const { data } = await supabase.from('exams').select('*').order('exam_date', { ascending: false })
        if (data) setExams(data)
    }

    const fetchScores = async (examId: string) => {
        setLoading(true)
        // 1. Get all students
        const { data: students } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('role', ['student', 'assistant'])
            .order('full_name')

        // 2. Get existing results
        const { data: results } = await supabase
            .from('exam_results')
            .select('*')
            .eq('exam_id', examId)

        if (students) {
            const merged = students.map(s => {
                const res = results?.find(r => r.student_id === s.id)
                return {
                    student_id: s.id,
                    student_name: s.full_name,
                    score: res ? res.score : '',
                    feedback: res ? res.feedback : ''
                }
            })
            setScores(merged)
        }
        setLoading(false)
    }

    const handleCreateExam = async () => {
        if (!newExamTitle) return

        try {
            const res = await fetch('/api/admin/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newExamTitle,
                    exam_date: newExamDate,
                    category: 'daily'
                })
            })
            const { data, error } = await res.json()

            if (res.ok && data) {
                setExams([data, ...exams])
                setSelectedExamId(data.id)
                setIsCreating(false)
                setNewExamTitle('')
            } else {
                alert('시험 생성 실패: ' + error)
            }
        } catch (e) {
            alert('오류 발생')
        }
    }

    const handleScoreChange = (index: number, value: string) => {
        const newScores = [...scores]
        newScores[index].score = value === '' ? '' : parseInt(value)
        setScores(newScores)
    }

    const saveScores = async () => {
        if (!selectedExamId) return
        setLoading(true)

        const payload = scores
            .filter(s => s.score !== '')
            .map(s => ({
                exam_id: selectedExamId,
                student_id: s.student_id,
                score: s.score,
                feedback: s.feedback
            }))

        try {
            const res = await fetch('/api/admin/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scores: payload })
            })

            const data = await res.json()
            if (res.ok && data.success) {
                alert('성적이 저장되었습니다.')
            } else {
                alert('저장 실패: ' + data.error)
            }
        } catch (e) {
            alert('저장 중 오류 발생')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="glass border-white/10 mt-6">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        성적 관리
                    </CardTitle>
                    <div className="flex gap-2">
                        {!isCreating ? (
                            <Button size="sm" onClick={() => setIsCreating(true)} variant="outline">
                                <Plus className="w-4 h-4 mr-1" /> 시험 추가
                            </Button>
                        ) : (
                            <div className="flex gap-2 items-center bg-gray-50 p-2 rounded animate-in fade-in">
                                <Input
                                    className="h-8 w-32"
                                    placeholder="시험명"
                                    value={newExamTitle}
                                    onChange={(e) => setNewExamTitle(e.target.value)}
                                />
                                <input
                                    type="date"
                                    className="h-8 border rounded px-2 text-xs"
                                    value={newExamDate}
                                    onChange={(e) => setNewExamDate(e.target.value)}
                                />
                                <Button size="sm" onClick={handleCreateExam}>생성</Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>취소</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Exam Selector */}
                <div className="mt-4">
                    <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder="시험을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {exams.map(e => (
                                <SelectItem key={e.id} value={e.id}>
                                    <span className="font-bold mr-2">{e.exam_date}</span>
                                    {e.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {selectedExamId ? (
                    <div className="space-y-4">
                        <div className="max-h-[400px] overflow-y-auto border rounded-md">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 text-left">이름</th>
                                        <th className="p-3 text-center w-24">점수</th>
                                        <th className="p-3 text-left">피드백 (선택)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {scores.map((s, idx) => (
                                        <tr key={s.student_id}>
                                            <td className="p-3 font-medium">{s.student_name}</td>
                                            <td className="p-3 text-center">
                                                <Input
                                                    type="number"
                                                    className="w-20 text-center mx-auto h-8"
                                                    value={s.score}
                                                    onChange={(e) => handleScoreChange(idx, e.target.value)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <Input
                                                    className="w-full h-8"
                                                    placeholder="피드백 입력"
                                                    value={s.feedback}
                                                    onChange={(e) => {
                                                        const newScores = [...scores]
                                                        newScores[idx].feedback = e.target.value
                                                        setScores(newScores)
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={saveScores} disabled={loading} variant="blue" className="font-bold">
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? '저장 중...' : '전체 성적 저장'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        시험을 선택하거나 새로 생성해주세요.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
