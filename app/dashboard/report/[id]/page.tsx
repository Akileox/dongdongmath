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
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            // Fetch Result + Exam Info
            const { data, error } = await supabase
                .from('exam_results')
                .select(`
                    *,
                    exams (
                        title,
                        exam_date,
                        total_score
                    )
                `)
                .eq('id', id)
                .single()

            if (data) {
                setResult(data)
            } else {
                // Fallback / Error handling
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
    const mean = 70 // Default mean since not in DB
    const sd = 15 // Default SD since not in DB
    const examDate = new Date(result.exams?.exam_date).toLocaleDateString()
    const examTitle = result.exams?.title
    const aiComment = result.feedback || "분석 결과가 없습니다."

    // Generate Bell Curve Path
    const width = 600 // Wider for full page
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
                    <p className="text-gray-500 mt-2">나의 성적 위치와 AI 분석 결과를 확인하세요.</p>
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

                {/* AI Comment */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white border-l-4 border-indigo-500">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            💡 AI 학습 코멘트
                        </h3>
                        <p className="text-indigo-800 leading-relaxed text-lg whitespace-pre-wrap">
                            {aiComment}
                        </p>
                        <div className="mt-4 flex gap-2">
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none">
                                추천 문제 풀기
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
