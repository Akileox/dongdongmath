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
    incorrects?: string
}

export function ScoreInputGrid() {
    // ... state ...

    const fetchScores = async (examId: string) => {
        setLoading(true)
        const { data: students } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('role', ['student', 'assistant'])
            .order('full_name')

        const { data: results } = await supabase
            .from('exam_results')
            .select('*, exam_incorrect_answers(question_number)')
            .eq('exam_id', examId)

        if (students) {
            const merged = students.map(s => {
                const res = results?.find(r => r.student_id === s.id)
                // Convert incorrect answers array to comma-separated string
                const incorrectString = res?.exam_incorrect_answers
                    ? res.exam_incorrect_answers.map((a: any) => a.question_number).sort((a: number, b: number) => a - b).join(', ')
                    : ''

                return {
                    student_id: s.id,
                    student_name: s.full_name,
                    score: res ? res.score : '',
                    feedback: res ? res.feedback : '',
                    incorrects: incorrectString
                }
            })
            setScores(merged)
        }
        setLoading(false)
    }

    // ... handleCreateExam ...
    // ... handleScoreChange ...

    const saveScores = async () => {
        if (!selectedExamId) return
        setLoading(true)

        const payload = scores
            .filter(s => s.score !== '')
            .map(s => ({
                exam_id: selectedExamId,
                student_id: s.student_id,
                score: s.score,
                feedback: s.feedback,
                incorrects: s.incorrects // Pass the string "1, 3, 5"
            }))

        try {
            const res = await fetch('/api/admin/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scores: payload })
            })
            // ...
        } catch (e) {
            // ...
        } finally {
            setLoading(false)
        }
    }

    return (
        // ...
        <div className="max-h-[400px] overflow-y-auto border rounded-md">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="p-3 text-left">이름</th>
                        <th className="p-3 text-center w-24">점수</th>
                        <th className="p-3 text-left">오답 문항 (번호, 쉼표구분)</th>
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
                                    placeholder="예: 1, 4, 5"
                                    value={s.incorrects || ''}
                                    onChange={(e) => {
                                        const newScores = [...scores]
                                        newScores[idx].incorrects = e.target.value
                                        setScores(newScores)
                                    }}
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
        // ...
    )
}
