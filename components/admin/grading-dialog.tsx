'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Question {
    id: string
    question_number: number
    score_value: number
}

interface GradingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    examTitle: string
    studentName: string
    resultId: string
    questions: Question[]
    initialDetails: Record<string, any> | null // { [question_id]: { is_correct: boolean } }
    onSave: () => void
}

export function GradingDialog({
    open,
    onOpenChange,
    examTitle,
    studentName,
    resultId,
    questions,
    initialDetails,
    onSave
}: GradingDialogProps) {
    const supabase = createClient()
    const [details, setDetails] = useState<Record<string, { is_correct: boolean }>>(initialDetails || {})

    // Calculate Score
    const totalScore = useMemo(() => {
        return questions.reduce((sum, q) => {
            // Default to Correct (true) if not specified in details
            const isCorrect = details[q.id]?.is_correct ?? true
            return sum + (isCorrect ? q.score_value : 0)
        }, 0)
    }, [questions, details])

    const handleToggle = (qId: string) => {
        setDetails(prev => {
            const current = prev[qId]?.is_correct ?? true
            return {
                ...prev,
                [qId]: { is_correct: !current }
            }
        })
    }

    const handleSave = async () => {
        // 1. Prepare Incorrect Answers List
        const incorrects = questions.filter(q => {
            const isCorrect = details[q.id]?.is_correct ?? true
            return !isCorrect
        })

        try {
            const res = await fetch('/api/admin/grading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    result_id: resultId,
                    score: totalScore,
                    details: details,
                    incorrects: incorrects
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || '저장 실패')

            onSave()
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            alert('저장 중 오류 발생: ' + error.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{studentName} - {examTitle} 채점</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-xl border">
                        <span className="text-gray-500 font-medium">총점</span>
                        <span className="text-3xl font-black text-blue-600">{totalScore}점</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {questions.map(q => {
                            const isCorrect = details[q.id]?.is_correct ?? true
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => handleToggle(q.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${isCorrect
                                        ? 'border-blue-100 bg-blue-50 hover:bg-blue-100'
                                        : 'border-red-100 bg-red-50 hover:bg-red-100'
                                        }`}
                                >
                                    <span className="text-sm font-bold text-gray-500 mb-1">{q.question_number}번</span>
                                    {isCorrect ? (
                                        <CheckCircle className="text-blue-500 w-8 h-8" />
                                    ) : (
                                        <XCircle className="text-red-500 w-8 h-8" />
                                    )}
                                    <span className={`text-xs mt-1 font-bold ${isCorrect ? 'text-blue-400' : 'text-red-400'}`}>
                                        {q.score_value}점
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave} className="w-full">
                        채점 완료 및 저장
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
