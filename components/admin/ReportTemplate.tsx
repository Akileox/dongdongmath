import React, { forwardRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, TrendingUp, AlertCircle, Quote } from "lucide-react"

export interface ReportData {
    studentName: string
    period: string
    mainScore: number
    rank: string // e.g., "Top 10%" or "1등급"
    totalQuestions: number
    correctRate: number
    weakness: string[]
    comment: string
    chartData?: any // Placeholder for now
}

interface ReportTemplateProps {
    data: ReportData
}

export const ReportTemplate = forwardRef<HTMLDivElement, ReportTemplateProps>(({ data }, ref) => {
    // Determine color theme based on score
    const themeColor = data.mainScore >= 90 ? 'bg-blue-600' : (data.mainScore >= 80 ? 'bg-green-600' : 'bg-orange-500')
    const maxScore = 100

    return (
        <div ref={ref} className="w-[600px] bg-white text-slate-900 font-sans overflow-hidden shadow-2xl rounded-none relative">
            {/* Header / Branding */}
            <div className={`${themeColor} text-white p-8 pb-16 relative`}>
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <TrendingUp size={120} />
                </div>
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-xl font-bold opacity-90">동동수학 학습 리포트</h2>
                        <h1 className="text-4xl font-extrabold mt-2">{data.period}</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-medium opacity-80">수강생</p>
                        <p className="text-3xl font-bold">{data.studentName}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Card (Floating) */}
            <div className="px-8 -mt-10 relative z-20">
                <Card className="border-none shadow-lg bg-white/95 backdrop-blur">
                    <CardContent className="p-6">
                        {/* Score Section */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
                            <div className="text-center w-1/2 border-r border-gray-100 pr-4">
                                <p className="text-sm text-gray-400 font-bold uppercase mb-1">Weekly Score</p>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className={`text-6xl font-black ${data.mainScore >= 90 ? 'text-blue-600' : 'text-slate-800'}`}>
                                        {data.mainScore}
                                    </span>
                                    <span className="text-2xl text-gray-400 font-medium">/ {maxScore}</span>
                                </div>
                            </div>
                            <div className="text-center w-1/2 pl-4">
                                <p className="text-sm text-gray-400 font-bold uppercase mb-1">Global Rank</p>
                                <div className="flex items-center justify-center gap-2">
                                    <Badge variant="outline" className="text-xl px-3 py-1 border-slate-200 bg-slate-50 text-slate-700">
                                        {data.rank}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">상위 4% 이내 진입 시 1등급 예상</p>
                            </div>
                        </div>

                        {/* Learning Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
                                <div className="bg-white p-2 rounded-lg shadow-sm text-blue-500">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold">풀이 문항 수</p>
                                    <p className="text-xl font-bold text-slate-800">{data.totalQuestions}문항</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
                                <div className="bg-white p-2 rounded-lg shadow-sm text-green-500">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold">정답률</p>
                                    <p className="text-xl font-bold text-slate-800">{data.correctRate}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Weakness Analysis */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                <AlertCircle size={16} /> 취약 유형 분석
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {data.weakness.length > 0 ? (
                                    data.weakness.map((w, i) => (
                                        <Badge key={i} className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 px-3 py-1 text-sm">
                                            {w} ⚠️
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">취약점이 발견되지 않았습니다. 완벽합니다! 🎉</p>
                                )}
                            </div>
                        </div>

                        {/* Teacher's Comment */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 relative">
                            <Quote size={20} className="absolute top-4 left-4 text-indigo-200 rotate-180" />
                            <p className="text-indigo-900 text-sm font-medium pl-6 leading-relaxed">
                                "{data.comment}"
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-6 text-center mt-4 border-t border-slate-100">
                <p className="text-xs text-gray-400">
                    본 리포트는 동동수학 AI 분석 시스템에 의해 생성되었습니다.<br />
                    문의사항: 010-1234-5678 (담당 선생님)
                </p>
            </div>
        </div>
    )
})

ReportTemplate.displayName = 'ReportTemplate'
