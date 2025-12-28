'use client'

import { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Play, TrendingUp, Clock, BookOpen, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock Data for Test Results
const RECENT_TESTS = [
    { id: 1, title: '수학I 주간 테스트 (12월 4주)', score: 92, average: 78, date: '2025.12.27', status: 'pass' },
    { id: 2, title: '미적분 기초 진단평가', score: 65, average: 70, date: '2025.12.26', status: 'warning' },
]

interface Lecture {
    id: string
    title: string
    section: string
    youtube_link: string
    created_at: string
}

import { useUserRole } from "@/hooks/use-user-role"

export default function DashboardPage() {
    const [lectures, setLectures] = useState<Lecture[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const { isAdmin } = useUserRole()

    useEffect(() => {
        async function fetchLectures() {
            const { data } = await supabase.from('lectures').select('*').order('created_at', { ascending: false })
            if (data) setLectures(data)
            setLoading(false)
        }
        fetchLectures()
    }, [])

    // Categorize by real 'section' column
    const categorize = (list: Lecture[]) => {
        const categories: Record<string, Lecture[]> = { '전체': list }

        list.forEach(l => {
            const subject = l.section || '기타' // Use real section
            if (!categories[subject]) categories[subject] = []
            categories[subject].push(l)
        })
        return categories
    }

    const categorizedLectures = categorize(lectures)
    const activeSubjects = Object.keys(categorizedLectures).filter(k => k !== '전체')

    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-sans text-gray-900">나의 강의실</h1>
                    <p className="text-gray-500 mt-2">오늘도 목표를 향해 달려봅시다.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
                    {isAdmin && (
                        <Link href="/dashboard/admin">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
                                관리자 대시보드
                            </Button>
                        </Link>
                    )}
                    <div className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg">
                        <TrendingUp size={16} className="text-green-400" />
                        <span>현재 상위 12% 페이스</span>
                    </div>
                </div>
            </div>

            {/* 1. Recent Test Result Section */}
            <section>
                <h2 className="text-xl font-bold mb-4 font-sans flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> 최근 테스트 결과
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {RECENT_TESTS.map(test => (
                        <div key={test.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900">{test.title}</h3>
                                    <p className="text-xs text-gray-500">{test.date}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${test.status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {test.score}점
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                                <div
                                    className={`h-2 rounded-full ${test.score >= test.average ? 'bg-green-500' : 'bg-orange-500'}`}
                                    style={{ width: `${test.score}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 text-right">평균 {test.average}점</p>
                        </div>
                    ))}
                    {/* Placeholder for no tests */}
                    {RECENT_TESTS.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            최근 응시한 테스트가 없습니다.
                        </div>
                    )}
                </div>
            </section>

            {/* 2. My Classes Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold font-sans flex items-center gap-2">
                        <BookOpen className="w-5 h-5" /> 수강 중인 클래스
                    </h2>
                </div>

                <Tabs defaultValue="전체" className="w-full">
                    <TabsList className="mb-6 bg-gray-100 p-1">
                        <TabsTrigger value="전체">전체</TabsTrigger>
                        {activeSubjects.map(sub => (
                            <TabsTrigger key={sub} value={sub}>{sub}</TabsTrigger>
                        ))}
                    </TabsList>

                    {['전체', ...activeSubjects].map(tabValue => (
                        <TabsContent key={tabValue} value={tabValue}>
                            {lectures.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {categorizedLectures[tabValue]?.map((lecture) => (
                                        <Card key={lecture.id} className="border-gray-200 bg-white hover:shadow-xl transition-all duration-300 group overflow-hidden">
                                            {/* Thumbnail Area */}
                                            <div className="aspect-video bg-gray-900 relative flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                                <Play size={48} className="text-white z-20 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                {/* Progress Bar Overlay */}
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-20">
                                                    <div className="h-full bg-green-500" style={{ width: '45%' }} />
                                                </div>
                                                <div className="absolute bottom-2 left-2 z-20 text-[10px] text-white font-bold bg-black/50 px-2 py-0.5 rounded-full">
                                                    진도율 45%
                                                </div>
                                            </div>

                                            <CardHeader className="pt-4 pb-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-bold text-gray-500 mb-1 block">
                                                        {lecture.section}
                                                    </span>
                                                </div>
                                                <CardTitle className="line-clamp-1 text-lg">{lecture.title}</CardTitle>
                                            </CardHeader>

                                            <CardContent className="pb-4">
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        <span>무제한 수강</span>
                                                    </div>
                                                    <div>이동재 강사</div>
                                                </div>
                                            </CardContent>

                                            <CardFooter className="pt-0">
                                                <Link href={`/dashboard/lectures/${lecture.id}`} className="w-full">
                                                    <Button className="w-full bg-black hover:bg-gray-800 text-white font-bold h-10">이어서 학습하기</Button>
                                                </Link>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                    {categorizedLectures[tabValue]?.length === 0 && (
                                        <div className="col-span-full text-center py-10 text-gray-400">
                                            해당 과목의 강의가 없습니다.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl">
                                    <div className="mb-4">등록된 강의가 없습니다.</div>
                                    <Link href="/questions">
                                        <Button variant="outline">수강 신청 문의하기</Button>
                                    </Link>
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </section>
        </div>
    )
}
