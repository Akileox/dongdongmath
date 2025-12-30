'use client'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play } from 'lucide-react'

export function StudentDashboardPreview() {
    // Mock Data
    const lectures = [
        { id: '1', title: '2026 수능 대비 수학 I - 지수로그함수', created_at: '2025-01-02' },
        { id: '2', title: '2026 수능 대비 수학 II - 미분계수', created_at: '2025-01-05' },
        { id: '3', title: '확률과 통계 - 경우의 수', created_at: '2025-01-10' },
    ]

    return (
        <div className="grid gap-8 p-6 border border-gray-200 rounded-lg bg-gray-50/50">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-sans mb-1">나의 강의실 (Admin Preview)</h1>
                    <p className="text-gray-500 text-sm">학생들에게 보여지는 화면 예시입니다.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {lectures.map((lecture) => (
                    <Card key={lecture.id} className="border-gray-200 bg-white hover:shadow-md transition-all group">
                        <CardHeader>
                            <CardTitle className="line-clamp-1">{lecture.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video bg-gray-100 rounded flex items-center justify-center mb-4 text-gray-400 group-hover:text-indigo-500 transition-colors">
                                <Play size={40} />
                            </div>
                            <p className="text-sm text-gray-400">등록일: {lecture.created_at}</p>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-black hover:bg-gray-800 text-white font-bold transition-colors">학습 시작하기</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}