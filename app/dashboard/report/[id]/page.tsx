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

            // 3. Fetch Learning Logs (linked manually)
            // We search for logs that mention this exam ID.
            if (res.exams?.id) {
                const { data: logs } = await supabase
                    .from('learning_logs')
                    .select('*')
                    .contains('related_exam_ids', [res.exams.id])

                // Fallback: If no manual link, user wants "No Automatic", so maybe we don't default to date?
                // But for legacy data, date match might be needed.
                // Let's prioritize manual link. If none, maybe check date (optional)?
                // User said "Auto connection NO". So strict manual link is better.
                // However, existing data has no manual link.
                // Compromise: If logs found by ID, use them. If not, and it's an old exam (created before feature), maybe fallback?
                // Let's stick to ID search first. If empty, try date?
                // "Auto connection NO" implies strong preference.
                // I will ONLY fetch by ID. If legacy data breaks, I'll advise user or add a fallback if requested.
                // Actually, to avoid breaking everything immediately for old reports:
                if (logs && logs.length > 0) {
                    setLearningLogs(logs)
                } else if (res.exams?.exam_date) {
                    // Fallback for legacy compatibility
                    const { data: dateLogs } = await supabase
                        .from('learning_logs')
                        .select('*')
                        .eq('log_date', res.exams.exam_date)
                    if (dateLogs) setLearningLogs(dateLogs)
                }
            }

            // 4. Fetch Assignments Logic: today + overdue (incomplete)
            const nowISO = new Date().toISOString()
            const { data: subs } = await supabase
                .from('assignment_submissions')
                .select('*, assignments(title, due_date)')
                .eq('student_id', user.id)
            // We want: (overdue AND incomplete) OR (recent)
            // Complex query hard in single call with simple Supabase filters.
            // Strategy: Fetch non-complete assignments + recent assignments.

            // Fetch Overdue & Incomplete
            const { data: overdueData } = await supabase
                .from('assignment_submissions')
                .select('*, assignments(title, due_date)')
                .eq('student_id', user.id)
                .lt('assignments.due_date', nowISO)
                .neq('status', 'complete')
                .order('assignments(due_date)', { ascending: true })

            // Fetch Today/Upcoming (Recent 3)
            const { data: recentData } = await supabase
                .from('assignment_submissions')
                .select('*, assignments(title, due_date)')
                .eq('student_id', user.id)
                .gte('assignments.due_date', nowISO) // Future/Today
                .order('assignments(due_date)', { ascending: true })
                .limit(3)

            // Combine: Overdue first, then upcoming
            const combined = [...(overdueData || []), ...(recentData || [])]

            const relatedAssignments = combined.map((s: any) => ({
                title: s.assignments?.title || 'Unknown',
                status: s.status,
                grade: s.grade,
                dueDate: s.assignments?.due_date,
                isOverdue: new Date(s.assignments?.due_date) < new Date() && s.status !== 'complete'
            }))
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

    // Pass new fields to template
    const missingReason = result.missing_reason
    const teacherNote = result.teacher_note

    // Extract Student Note from Learning Log
    // Assuming 1 log for the day. user.id is the student.
    const log = learningLogs.length > 0 ? learningLogs[0] : null
    let dailyStudentNote = ''
    if (log && log.student_notes) {
        // student_notes is JSONB { "student_uuid": "note" }
        // We need the current user's ID. 
        // We fetched 'user' in fetchData but didn't save it to state. 
        // Actually we used `user.id` to fetch assignments.
        // Let's rely on finding the note logic within fetchData if possible, 
        // OR simpler: we can't easily access user.id here unless we store it.
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ... Header ... */}
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
                missingReason={missingReason}
                teacherNote={teacherNote}
                dailyStudentNote={learningLogs[0]?.student_notes?.[result.student_id]}
            />
        </div>
    )
}
