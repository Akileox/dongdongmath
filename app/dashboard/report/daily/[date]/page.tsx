'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ReportTemplate } from "@/components/reports/report-template"

export default function DailyReportPage({ params }: { params: Promise<{ date: string }> }) {
    const router = useRouter()
    const { date } = use(params)
    const [result, setResult] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [relatedAssignments, setRelatedAssignments] = useState<any[]>([])
    const [learningLogs, setLearningLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [hasExam, setHasExam] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            // 1. Check Exam
            const { data: examsOnDate } = await supabase
                .from('exams')
                .select('id')
                .eq('exam_date', date)

            let foundResult = null
            if (examsOnDate && examsOnDate.length > 0) {
                const examIds = examsOnDate.map(e => e.id)
                const { data: res } = await supabase
                    .from('exam_results')
                    .select(`
                        *,
                        exams (
                            id,
                            title,
                            exam_date,
                            total_score,
                            category
                        )
                    `)
                    .in('exam_id', examIds)
                    .eq('student_id', user.id)
                    .maybeSingle()

                foundResult = res
            }

            if (foundResult) {
                setHasExam(true)
                setResult(foundResult)

                const { data: qData } = await supabase
                    .from('exam_questions')
                    .select('*')
                    .eq('exam_id', foundResult.exams.id)
                    .order('question_number', { ascending: true })
                if (qData) setQuestions(qData)
            } else {
                setHasExam(false)
            }

            // 2. Fetch Logs
            const { data: logs } = await supabase
                .from('learning_logs')
                .select('*')
                .eq('log_date', date)
            if (logs) setLearningLogs(logs)

            // 3. Fetch Assignments (Due date matching)
            const startOfDay = `${date}T00:00:00`
            const endOfDay = `${date}T23:59:59`
            const { data: asms } = await supabase
                .from('assignments')
                .select('id, title, due_date')
                .gte('due_date', startOfDay)
                .lte('due_date', endOfDay)

            if (asms && asms.length > 0) {
                const asmIds = asms.map(a => a.id)
                const { data: subs } = await supabase
                    .from('assignment_submissions')
                    .select('*, assignments(title)')
                    .in('assignment_id', asmIds)
                    .eq('student_id', user.id)

                if (subs) setRelatedAssignments(subs)
            }

            setLoading(false)
        }
        fetchData()
    }, [date, supabase, router])

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">리포트 로딩 중...</div>

    // Data Prep for Template
    const dateObj = new Date(date)
    const dateDisplay = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`
    const title = hasExam && result?.exams?.title ? result.exams.title : '일일 학습 리포트'

    // Exam Data
    const score = result?.score || 0
    const examCategory = result?.exams?.category || ''
    const isMajorExam = ['Midterm', 'Final', '중간고사', '기말고사'].includes(examCategory)
    // Mock Statistics if needed
    const mean = 70
    const sd = 15

    // Incorrect Questions Prep
    const incorrectQs = hasExam && questions.length > 0
        ? questions.filter(q => {
            const detail = result.details?.[q.id]
            return detail && detail.is_correct === false
        })
        : []

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Nav Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-black">
                        <ArrowLeft className="w-5 h-5 mr-1" /> 돌아가기
                    </Button>
                    <h1 className="text-lg font-bold text-gray-900 hidden md:block">리포트 상세</h1>
                </div>
            </div>

            <ReportTemplate
                date={dateDisplay}
                title={title}
                hasExam={hasExam}
                score={score}
                mean={mean}
                sd={sd}
                gradePrediction={1} // Mock
                isMajorExam={isMajorExam}
                incorrectQuestions={incorrectQs}
                aiFeedback={result?.feedback}
                learningLogs={learningLogs}
                relatedAssignments={relatedAssignments}
            />
        </div>
    )
}
