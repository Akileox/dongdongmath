'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Share2, Download, BookOpen } from "lucide-react"

export default function LearningReportPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [result, setResult] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            // Fetch Result + Exam Info
            const { data: resData, error } = await supabase
                .from('exam_results')
                .select(`
                    *,
                    exams (
                        id,
                        title,
                        exam_date,
                        total_score
                    )
                `)
                .eq('id', id)
                .single()

            if (resData) {
                setResult(resData)
                // Fetch Questions
                const { data: qData } = await supabase
                    .from('exam_questions')
                    .select('*')
                    .eq('exam_id', resData.exams.id)
                    .order('question_number', { ascending: true })

                if (qData) setQuestions(qData)
            } else {
                console.error(error)
            }
            setLoading(false)
        }
        fetchData()
    }, [id, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
    if (!result) return <div className="min-h-screen flex items-center justify-center">리포트를 찾을 수 없습니다.</div>

    // Data Mapping
    const myScore = result.score
    const mean = 70
    const sd = 15
    const examDate = new Date(result.exams?.exam_date).toLocaleDateString()
    const examTitle = result.exams?.title
    const aiComment = result.feedback || "분석 결과가 없습니다."
    const details = result.details || {}

    // Identify Weak Points (Incorrect Questions)
    const incorrectQuestions = questions.filter(q => {
        // If details exist, use them. If not (legacy), assume correct or unknown?
        // Let's assume if details entry is missing, it's correct (default) or handle gracefully.
        // In GradingDialog, missing means Correct.
        const d = details[q.id]
        return d && d.is_correct === false
    })

    // Generate Bell Curve Path
    const width = 600
    const height = 200
    const points = []
    for (let x = 0; x <= width; x += 5) {
        const score = 30 + (x / width) * 70
        const y = (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((score - mean) / sd, 2))
        const plotY = height - (y * 4000)
        points.push(`${x},${plotY}`)
    }
    const pathData = `M0,${height} L${points.join(' L')} L${width},${height} Z`
    const myX = ((myScore - 30) / 70) * width

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Nav */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-black">
                        <ArrowLeft className="w-5 h-5 mr-1" /> 돌아가기
                    </Button>
                    <h1 className="text-lg font-bold text-gray-900 hidden md:block">학습 분석 리포트</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" /> 공유
                    </Button>
                    <Button variant="blue" size="sm">
                        <Download className="w-4 h-4 mr-2" /> PDF 저장
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Title Section */}
                <div className="text-center py-6">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold mb-3 inline-block">
                        {examDate}
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900">{examTitle}</h2>
                    <p className="text-gray-500 mt-2">나의 성적 위치와 상세 분석 결과를 확인하세요.</p>
                </div>

                {/* Score Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <span className="text-gray-500 text-sm font-bold mb-2">나의 점수</span>
                            <span className="text-5xl font-black text-blue-600">{myScore}</span>
                            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded font-bold mt-2">상위 10%</span>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <span className="text-gray-500 text-sm font-bold mb-2">수강생 평균</span>
                            <span className="text-5xl font-black text-gray-400">{mean}</span>
                            <span className="text-sm text-gray-400 mt-2">표준편차 {sd}</span>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <span className="text-gray-500 text-sm font-bold mb-2">등급 예측</span>
                            <span className="text-5xl font-black text-purple-600">1</span>
                            <span className="text-sm text-gray-400 mt-2">안정권</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Bell Curve Graph */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📊 전체 성적 분포
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative h-64 w-full">
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="curveGradient" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                                    </linearGradient>
                                </defs>
                                <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#f3f4f6" strokeDasharray="5,5" />
                                <path d={pathData} fill="url(#curveGradient)" stroke="#2563eb" strokeWidth="3" />
                                <line x1={myX} y1="0" x2={myX} y2={height} stroke="#ef4444" strokeWidth="2" strokeDasharray="5,3" />
                            </svg>
                            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur border border-red-100 shadow-sm px-3 py-1 rounded-lg text-sm font-bold text-red-600">
                                My Score: {myScore}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Weak Points & Topics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm bg-red-50/50 border-red-100">
                        <CardHeader>
                            <CardTitle className="text-red-900 flex items-center gap-2">🚨 오답 분석 (취약 유형)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {incorrectQuestions.length === 0 ? (
                                <p className="text-green-600 font-bold">오답이 없습니다! 완벽해요! 🎉</p>
                            ) : (
                                <ul className="space-y-2">
                                    {incorrectQuestions.map(q => (
                                        <li key={q.id} className="flex items-start gap-2 text-sm text-red-800">
                                            <span className="font-bold min-w-[30px]">{q.question_number}번</span>
                                            <span>{q.description || '유형 설명이 없습니다.'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-blue-50/50 border-blue-100">
                        <CardHeader>
                            <CardTitle className="text-blue-900 flex items-center gap-2">💡 학습 전략</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-blue-800 text-sm leading-relaxed">
                                {incorrectQuestions.length > 0
                                    ? `총 ${incorrectQuestions.length}개의 오답이 있습니다. 위 취약 유형을 중심으로 개념 강의를 복습하는 것을 추천합니다.`
                                    : `완벽한 점수입니다! 심화 문제를 통해 실력을 더 단단하게 다져보세요.`
                                }
                            </p>
                            <div className="mt-4">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                                    추천 강의 보러가기
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Table */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle>📝 문항별 상세 내역</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">번호</th>
                                        <th className="px-4 py-3">유형 / 설명</th>
                                        <th className="px-4 py-3 text-center">배점</th>
                                        <th className="px-4 py-3 text-center">채점 결과</th>
                                        <th className="px-4 py-3 rounded-r-lg text-center">상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map((q) => {
                                        const isCorrect = details[q.id]?.is_correct ?? true // Default to correct if missing? Or show as un-graded?
                                        // Actually if details is empty (legacy), we usually assumed full score or manual score.
                                        // But for new system, use details.

                                        return (
                                            <tr key={q.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="px-4 py-3 font-bold">{q.question_number}</td>
                                                <td className="px-4 py-3 text-gray-600">{q.description || '-'}</td>
                                                <td className="px-4 py-3 text-center">{q.score_value}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {isCorrect ? (
                                                        <span className="text-blue-600 font-bold">O</span>
                                                    ) : (
                                                        <span className="text-red-500 font-bold">X</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {isCorrect ? (
                                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">정답</span>
                                                    ) : (
                                                        <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">오답</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {questions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-6 text-gray-400">문항 정보가 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Comment (Original) */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white border-l-4 border-indigo-500">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            🤖 종합 AI 피드백
                        </h3>
                        <p className="text-indigo-800 leading-relaxed text-lg whitespace-pre-wrap">
                            {aiComment}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
