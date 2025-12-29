'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface ScoreData {
    label: string
    score: number
    avg: number
}

// Mock Data
const data: ScoreData[] = [
    { label: '9월 1주', score: 78, avg: 72 },
    { label: '9월 3주', score: 82, avg: 74 },
    { label: '10월 1주', score: 85, avg: 75 },
    { label: '10월 3주', score: 81, avg: 76 },
    { label: '11월 1주', score: 88, avg: 78 },
    { label: '11월 3주', score: 92, avg: 78 },
    { label: '12월 1주', score: 89, avg: 79 },
    { label: '12월 4주', score: 92, avg: 80 },
]

export function ScoreTrendChart() {
    // Chart Dimensions
    const width = 800
    const height = 300
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Scales
    const maxScore = 100
    const minScore = 60 // Zoom in a bit

    const getX = (index: number) => padding + (index / (data.length - 1)) * chartWidth
    const getY = (score: number) => height - padding - ((score - minScore) / (maxScore - minScore)) * chartHeight

    // Generate Path for Student Score
    const scorePath = data.map((d, i) =>
        `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.score)}`
    ).join(' ')

    // Generate Path for Average
    const avgPath = data.map((d, i) =>
        `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.avg)}`
    ).join(' ')

    return (
        <Card className="col-span-1 lg:col-span-2 border-gray-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> 성적 변화 추이
                </CardTitle>
                <p className="text-sm text-gray-500">최근 4개월간의 주간 테스트 성적 변화입니다.</p>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto">
                    <div className="min-w-[600px]">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                            {/* Grid Lines */}
                            {[60, 70, 80, 90, 100].map(score => (
                                <g key={score}>
                                    <line
                                        x1={padding}
                                        y1={getY(score)}
                                        x2={width - padding}
                                        y2={getY(score)}
                                        stroke="#f3f4f6"
                                        strokeWidth="1"
                                    />
                                    <text x={padding - 10} y={getY(score) + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{score}</text>
                                </g>
                            ))}

                            {/* Average Line (Dashed) */}
                            <path d={avgPath} fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5,5" />

                            {/* Score Line (Solid Blue) */}
                            <path d={scorePath} fill="none" stroke="#2563eb" strokeWidth="3" />

                            {/* Data Points */}
                            {data.map((d, i) => (
                                <g key={i} className="group cursor-pointer">
                                    {/* Point Interactivity Target */}
                                    <circle cx={getX(i)} cy={getY(d.score)} r="15" fill="transparent" />

                                    {/* Visible Point */}
                                    <circle cx={getX(i)} cy={getY(d.score)} r="4" fill="white" stroke="#2563eb" strokeWidth="2" className="group-hover:r-6 transition-all" />

                                    {/* Tooltip on Hover */}
                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <rect x={getX(i) - 20} y={getY(d.score) - 35} width="40" height="25" rx="4" fill="black" />
                                        <text x={getX(i)} y={getY(d.score) - 19} fontSize="12" fill="white" textAnchor="middle" fontWeight="bold">
                                            {d.score}
                                        </text>
                                    </g>

                                    {/* X Axis Labels */}
                                    <text x={getX(i)} y={height - padding + 20} fontSize="10" fill="#6b7280" textAnchor="middle">{d.label}</text>
                                </g>
                            ))}

                            {/* Legend */}
                            <g transform={`translate(${width - 150}, ${padding})`}>
                                <circle cx="0" cy="0" r="3" fill="#2563eb" />
                                <text x="10" y="4" fontSize="12" fill="#374151">내 점수</text>
                                <circle cx="0" cy="20" r="3" fill="#d1d5db" />
                                <text x="10" y="24" fontSize="12" fill="#9ca3af">반 평균</text>
                            </g>
                        </svg>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
