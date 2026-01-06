import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, AlertCircle, Lightbulb, CalendarCheck, CheckSquare } from "lucide-react"

interface ReportTemplateProps {
    date: string
    title: string
    studentName?: string

    // Exam Data (Optional if no exam)
    hasExam: boolean
    score?: number
    mean?: number
    sd?: number
    maxScore?: number
    rankPercentage?: number
    gradePrediction?: number | string
    isMajorExam?: boolean

    // Analysis
    incorrectQuestions?: any[] // Legacy or specific subset
    allQuestions?: any[] // Full list { question_number, is_correct, description, answer }
    aiFeedback?: string

    // Daily Logs & Assignments
    learningLogs: any[]
    relatedAssignments: any[]

    // UI Options
    isPreview?: boolean // If true, hides interactive buttons like "Download PDF" to avoid clutter in admin view
}

export function ReportTemplate({
    date,
    title,
    hasExam,
    score = 0,
    mean = 70,
    sd = 15,
    maxScore = 100,
    rankPercentage,
    gradePrediction,
    isMajorExam = false,
    incorrectQuestions = [],
    allQuestions = [],
    aiFeedback,
    learningLogs = [],
    relatedAssignments = [],
    isPreview = false
}: ReportTemplateProps) {

    // Helper for Bell Curve
    const width = 600
    const height = 200
    const points = []

    // 1. Calculate Peak Density (at x=mean) to normalize height
    // Density at mean is 1 / (sd * sqrt(2*PI))
    // We want this peak to correspond to approx 80% of the graph height (0.8 * height)
    // So: scaleFactor * maxDensity = 0.8 * height
    // scaleFactor = (0.8 * height) / maxDensity
    const maxDensity = 1 / (sd * Math.sqrt(2 * Math.PI))
    const scaleFactor = (height * 0.8) / maxDensity

    // Plot curve from 0 to maxScore
    for (let x = 0; x <= width; x += 5) {
        // Map graphical x (0-600) to score s (0-maxScore)
        const s = (x / width) * maxScore

        // Normal Distribution Formula
        const density = (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((s - mean) / sd, 2))

        // Scale Y
        const y = density * scaleFactor
        const plotY = height - y // Invert for SVG (0 is top)

        points.push(`${x},${plotY}`)
    }
    const pathData = `M0,${height} L${points.join(' L')} L${width},${height} Z`

    // Map my score to graphical x
    // avoid out of bounds
    const clampedScore = Math.max(0, Math.min(score, maxScore))
    const myX = (clampedScore / maxScore) * width

    return (
        <div id="report-content" className="max-w-4xl mx-auto p-6 space-y-6 bg-white min-h-screen">
            {/* Header */}
            <div className="text-center py-8">
                <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4 inline-block">
                    {date}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-500">학습 분석 리포트</p>
            </div>

            {hasExam ? (
                <>
                    {/* Score Cards */}
                    <div className={`grid grid-cols-1 ${isMajorExam ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                        <Card className="border-none shadow-sm bg-blue-50/50">
                            <CardContent className="flex flex-col items-center justify-center py-8">
                                <span className="text-gray-500 text-sm font-bold mb-2">나의 점수</span>
                                <span className="text-5xl font-black text-blue-600">{score}점</span>
                                {rankPercentage && <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded font-bold mt-2">상위 {rankPercentage}%</span>}
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-gray-50">
                            <CardContent className="flex flex-col items-center justify-center py-8">
                                <span className="text-gray-500 text-sm font-bold mb-2">수강생 평균</span>
                                <span className="text-5xl font-black text-gray-400">{mean}점</span>
                                <span className="text-xs text-gray-400 mt-2">표준편차 {sd}</span>
                            </CardContent>
                        </Card>
                        {isMajorExam && gradePrediction && (
                            <Card className="border-none shadow-sm bg-purple-50/50">
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <span className="text-gray-500 text-sm font-bold mb-2">예상 등급</span>
                                    <span className="text-5xl font-black text-purple-600">{gradePrediction}등급</span>
                                    <span className="text-xs text-purple-400 mt-2">안정권</span>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Distribution Graph */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden border border-gray-100">
                        <CardHeader><CardTitle className="text-base text-gray-700">📊 전체 성적 분포</CardTitle></CardHeader>
                        <CardContent>
                            <div className="relative h-64 w-full">
                                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                                    <defs><linearGradient id="curveGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" /></linearGradient></defs>
                                    <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#f3f4f6" strokeDasharray="5,5" />
                                    <path d={pathData} fill="url(#curveGradient)" stroke="#2563eb" strokeWidth="3" />
                                    <line x1={myX} y1="0" x2={myX} y2={height} stroke="#ef4444" strokeWidth="2" strokeDasharray="5,3" />
                                </svg>
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-red-100 shadow px-3 py-1 rounded-full text-sm font-bold text-red-600">
                                    My Score: {score}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Incorrect / Strategy Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Incorrect Analysis Card */}
                        <Card className="border-none shadow-sm bg-white border border-gray-100">
                            <CardHeader><CardTitle className="text-gray-800 flex items-center gap-2 text-base"><AlertCircle className="w-5 h-5 text-red-500" /> 오답 분석</CardTitle></CardHeader>
                            <CardContent>
                                {incorrectQuestions.length === 0 ? (
                                    <p className="text-green-600 font-bold p-4">오답이 없습니다! 완벽해요! 🎉</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {incorrectQuestions.map((q, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-700 bg-red-50 p-3 rounded-lg">
                                                <span className="font-black text-red-500 min-w-[30px]">{q.question_number}번</span>
                                                <span className="leading-relaxed">{q.description || '유형 설명이 없습니다.'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {/* Strategy Card */}
                        <Card className="border-none shadow-sm bg-blue-50/30 border border-blue-100">
                            <CardHeader><CardTitle className="text-blue-900 flex items-center gap-2 text-base"><Lightbulb className="w-5 h-5" /> 추천 학습 전략</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-line">
                                    {incorrectQuestions.length > 0
                                        ? `총 ${incorrectQuestions.length}개의 오답이 있습니다.\n위 취약 유형에 해당하는 개념 강의를 다시 복습하고, 유사 문항을 풀어보세요.`
                                        : `완벽한 성취도입니다.\n심화 문제 풀이를 통해 실력을 유지하고, 다음 단원으로 넘어가셔도 좋습니다.`
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Question Analysis Table (Full Width) */}
                    {allQuestions && allQuestions.length > 0 && (
                        <Card className="border-none shadow-sm bg-white border border-gray-100">
                            <CardHeader><CardTitle className="text-gray-800 flex items-center gap-2 text-base"><CheckSquare className="w-5 h-5" /> 문항별 상세 분석</CardTitle></CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                            <tr>
                                                <th className="py-2 px-4 w-16 text-center">번호</th>
                                                <th className="py-2 px-4 w-16 text-center">결과</th>
                                                <th className="py-2 px-4">유형 / 내용</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {allQuestions.sort((a: any, b: any) => a.question_number - b.question_number).map((q: any, i: number) => (
                                                <tr key={i} className={q.is_correct ? 'bg-white' : 'bg-red-50/30'}>
                                                    <td className="py-3 px-4 text-center font-bold text-gray-700">{q.question_number}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        {q.is_correct ? (
                                                            <span className="text-blue-500 font-bold">O</span>
                                                        ) : (
                                                            <span className="text-red-500 font-bold">X</span>
                                                        )}
                                                    </td>
                                                    <td className={`py-3 px-4 ${q.is_correct ? 'text-gray-600' : 'text-red-800 font-medium'}`}>
                                                        {q.description || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            ) : (
                // No Exam View
                <div className="text-center py-12 bg-gray-50 rounded-xl mb-8">
                    <h3 className="text-xl font-bold text-gray-400">오늘 진행된 테스트가 없습니다.</h3>
                    <p className="text-gray-400 text-sm mt-2">오늘의 학습 활동 내역을 확인하세요.</p>
                </div>
            )}

            {/* Learning Logs */}
            {learningLogs.length > 0 ? learningLogs.map((log, i) => (
                <Card key={i} className="border-none shadow-sm bg-gradient-to-br from-green-50 to-white border-l-4 border-green-500">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2 text-lg">
                            <BookOpen className="w-5 h-5" /> 오늘의 학습 내용
                        </h3>
                        <p className="text-green-800 leading-relaxed whitespace-pre-wrap">
                            {log.content}
                        </p>
                    </CardContent>
                </Card>
            )) : (
                !hasExam && (
                    <Card className="border-none shadow-sm bg-white border border-dashed border-gray-200">
                        <CardContent className="p-8 text-center text-gray-400">
                            등록된 학습 코멘트가 없습니다.
                        </CardContent>
                    </Card>
                )
            )}

            {/* Assignments */}
            {relatedAssignments.length > 0 && (
                <Card className="border-none shadow-sm bg-blue-50/50 border-blue-100">
                    <CardHeader><CardTitle className="text-blue-900 flex items-center gap-2 text-base"><CalendarCheck className="w-5 h-5" /> 과제 현황</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {relatedAssignments.map((sub, i) => (
                                <div key={i} className="bg-white p-3 rounded-lg border border-blue-100 flex justify-between items-center shadow-sm">
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm mb-1">{sub.assignments?.title || sub.title}</div>
                                        <div className="text-xs text-gray-500">
                                            {sub.status === 'submitted' ? <span className="text-blue-600 font-bold">제출 완료</span> : <span className="text-gray-400">미제출</span>}
                                        </div>
                                    </div>
                                    {sub.grade && <span className="text-lg font-bold text-blue-600">{sub.grade}%</span>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AI Feedback (Only show if exam exists, or maybe generic feedback) */}
            {hasExam && aiFeedback && (
                <Card className="border-none shadow-sm bg-indigo-50/50 border-l-4 border-indigo-500">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">🤖 종합 AI 분석</h3>
                        <p className="text-indigo-800 leading-relaxed">{aiFeedback}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
