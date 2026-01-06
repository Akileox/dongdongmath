'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ReportTemplate } from "@/components/reports/report-template"

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [result, setResult] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([]) // Incorrects
    const [allQuestionsMeta, setAllQuestionsMeta] = useState<any[]>([]) // Metadata
    const [learningLogs, setLearningLogs] = useState<any[]>([])
    const [relatedAssignments, setRelatedAssignments] = useState<any[]>([])
    const [stats, setStats] = useState({ mean: 0, sd: 0, rank: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // 1. Fetch Exam Result
            const { data: res, error } = await supabase
                .from('exam_results')
                .select(`
                    *,
                    exams (
                        id,
                        title,
                        exam_date,
                        total_score,
                        category,
                        max_score
                    )
                `)
                .eq('id', id)
                .single()

            if (error || !res) {
                alert('리포트를 찾을 수 없습니다.')
                router.push('/dashboard')
                return
            }
            setResult(res)

            // 2. Fetch Questions (Metadata) & Incorrect Answers (Result)
            const { data: qData } = await supabase
                .from('exam_questions')
                .select('*')
                .eq('exam_id', res.exams.id)
                .order('question_number', { ascending: true })

            const { data: incorrects } = await supabase
                .from('exam_incorrect_answers')
                .select('question_number, description')
                .eq('result_id', res.id)
                .order('question_number', { ascending: true })

            // Store pure incorrects for fallback/logic
            if (incorrects) setQuestions(incorrects)

            // Store all questions for table
            if (qData) {
                setAllQuestionsMeta(qData)
            }

            // 3. Fetch Learning Logs
            if (res.exams?.exam_date) {
                const { data: logs } = await supabase
                    .from('learning_logs')
                    .select('*')
                    .eq('log_date', res.exams.exam_date)
                if (logs) setLearningLogs(logs)
            }

            // 4. Fetch Assignments (Recent 5)
            const { data: subs } = await supabase
                .from('assignment_submissions')
                .select('*, assignments(title, due_date)')
                .eq('student_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            const relatedAssignments = subs ? subs.map((s: any) => ({
                title: s.assignments?.title || 'Unknown',
                status: s.status,
                grade: s.grade
            })) : []
            setRelatedAssignments(relatedAssignments)

            // 5. Calculate Stats (Mean, SD, Rank)
            const { data: allScores } = await supabase
                .from('exam_results')
                .select('score')
                .eq('exam_id', res.exams.id)

            if (allScores && allScores.length > 0) {
                const scores = allScores.map(s => s.score)
                const sum = scores.reduce((a, b) => a + b, 0)
                const avg = sum / scores.length

                // Variance / SD
                const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length
                const stdDev = Math.sqrt(variance)

                // Rank
                const myScore = res.score
                const sorted = [...scores].sort((a, b) => b - a)
                const rank = sorted.indexOf(myScore) + 1

                setStats({
                    mean: avg,
                    sd: stdDev || 1, // Prevent 0 division in graph if needed, though graph formula handles 0? No, 0 SD would be infinite height. Default to 1 if SD is 0.
                    rank: rank,
                    total: scores.length
                })
            }

            setLoading(false)
        }
        fetchData()
    }, [id, supabase, router])

    if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
    if (!result) return null

    // Helper: Calculate Question Status
    const incorrectQuestions = questions
    const fullQuestionList = allQuestionsMeta.length > 0 ? allQuestionsMeta.map(q => {
        const isIncorrect = incorrectQuestions.some(inc => Number(inc.question_number) === Number(q.question_number))
        return {
            question_number: q.question_number,
            description: q.description || '',
            is_correct: !isIncorrect,
            answer: q.answer
        }
    }) : []

    const examCategory = result.exams?.category || ''
    const isMajorExam = ['Midterm', 'Final', '중간고사', '기말고사'].includes(examCategory)
    const dateObj = new Date(result.exams?.exam_date)
    const dateDisplay = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-black">
                        <ArrowLeft className="w-5 h-5 mr-1" /> 돌아가기
                    </Button>
                    <h1 className="text-lg font-bold text-gray-900 hidden md:block">시험 결과 상세</h1>
                </div>
            </div>

            <ReportTemplate
                date={dateDisplay}
                title={result.exams?.title || '시험 결과'}
                hasExam={true}
                score={result.score}
                mean={stats.mean}
                sd={stats.sd}
                maxScore={result.exams?.max_score || result.exams?.total_score || 100}
                gradePrediction={stats.rank && stats.total ? `${Math.ceil((stats.rank / stats.total) * 9)}` : '-'}
                isMajorExam={isMajorExam}
                incorrectQuestions={incorrectQuestions}
                allQuestions={fullQuestionList}
                aiFeedback={result.feedback}
                learningLogs={learningLogs}
                relatedAssignments={relatedAssignments}
            />
        </div>
    )
}
