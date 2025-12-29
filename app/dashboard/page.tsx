'use client'

import { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from 'next/link'
import { Play, TrendingUp, BookOpen, AlertCircle, ChevronRight, Layers } from 'lucide-react'

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

interface Course {
    title: string
    lectureCount: number
    firstLectureId: string
    lastUpdated: string
}

import { useUserRole } from "@/hooks/use-user-role"
import { ScoreTrendChart } from "@/components/dashboard/score-trend-chart"


export default function DashboardPage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const { isAdmin, role, loading: roleLoading } = useUserRole()

    useEffect(() => {
        async function fetchLectures() {
            // Fetch all lectures
            const { data } = await supabase.from('lectures').select('*').order('created_at', { ascending: true })

            if (data) {
                // Group by Section to create "Courses"
                const courseMap = new Map<string, Course>()

                data.forEach((lecture: Lecture) => {
                    const sectionName = lecture.section || '기타 강좌'

                    if (!courseMap.has(sectionName)) {
                        courseMap.set(sectionName, {
                            title: sectionName,
                            lectureCount: 0,
                            firstLectureId: lecture.id, // Since we ordered by ascending, the first one seen is the first lecture
                            lastUpdated: lecture.created_at
                        })
                    }

                    const course = courseMap.get(sectionName)!
                    course.lectureCount++
                    // Update lastUpdated if this lecture is newer
                    if (new Date(lecture.created_at) > new Date(course.lastUpdated)) {
                        course.lastUpdated = lecture.created_at
                    }
                })

                setCourses(Array.from(courseMap.values()))
            }
            setLoading(false)
        }
        fetchLectures()
    }, [])

    // Prevent flash while checking role
    if (roleLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

    // STUDENT DASHBOARD (Accessible to Admins too)
    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-sans text-gray-900">
                        나의 강의실
                        <span className="ml-3 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {roleLoading ? 'Loading...' : `Role: ${role}`}
                        </span>
                    </h1>
                    <p className="text-gray-500 mt-2">학습 현황과 테스트 결과를 한눈에 확인하세요.</p>
                </div>
                {isAdmin && (
                    <Link href="/admin">
                        <Button variant="blue">🔧 관리자 대시보드 바로가기</Button>
                    </Link>
                )}
            </div>

            {/* 1. Test Results & Learning Report Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold font-sans flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" /> 최근 테스트 결과
                    </h2>
                    <Button variant="ghost" className="text-sm text-gray-500 hover:text-black">
                        전체 보기 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Mock Data Card 1 */}
                    <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">주간 테스트</span>
                                <span className="text-xs text-gray-400">2025.12.27</span>
                            </div>
                            <CardTitle className="text-lg font-bold">수학I 12월 4주차 평가</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-3xl font-bold font-sans">92</span>
                                <span className="text-sm text-gray-400 mb-1">/ 100점</span>
                                <span className="ml-auto text-sm text-green-600 font-bold bg-green-50 px-2 py-1 rounded">
                                    상위 10%
                                </span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-500">
                                <div className="flex justify-between">
                                    <span>반 평균</span>
                                    <span className="font-medium text-gray-900">78점</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>최고 점수</span>
                                    <span className="font-medium text-gray-900">100점</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Link href="/dashboard/report/1" className="w-full">
                                <Button className="w-full bg-black text-white hover:bg-gray-800" size="sm">
                                    <BookOpen className="w-4 h-4 mr-2" /> 학습 결과서 확인
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Mock Data Card 2 (Updated: Neutral) */}
                    <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">진단 평가</span>
                                <span className="text-xs text-gray-400">2025.12.26</span>
                            </div>
                            <CardTitle className="text-lg font-bold">미적분 기초 실력 점검</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-3xl font-bold font-sans text-gray-900">78</span>
                                <span className="text-sm text-gray-400 mb-1">/ 100점</span>
                                <span className="ml-auto text-sm text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                    평균 수준
                                </span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-500">
                                <div className="flex justify-between">
                                    <span>반 평균</span>
                                    <span className="font-medium text-gray-900">75점</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>통과 기준</span>
                                    <span className="font-medium text-gray-900">80점</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full" size="sm">
                                <TrendingUp className="w-4 h-4 mr-2" /> 오답 노트 보러가기
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Score Trend Graph */}
                <div className="mt-6">
                    <ScoreTrendChart />
                </div>
            </section>

            {/* 2. Course List Section (Refactored) */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold font-sans flex items-center gap-2">
                        <BookOpen className="w-5 h-5" /> 수강 중인 강좌
                    </h2>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400">강좌 정보를 불러오는 중...</div>
                ) : courses.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <Link key={course.title} href={`/dashboard/lectures/${course.firstLectureId}`} className="group">
                                <Card className="h-full border-gray-200 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <CardHeader className="pb-4 relative z-10">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                                <Layers size={24} />
                                            </div>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                                                수강 중
                                            </span>
                                        </div>
                                        <CardTitle className="text-xl font-bold leading-tight group-hover:text-blue-600 transition-colors">
                                            {course.title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="pb-4 relative z-10">
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <BookOpen size={14} />
                                                <span>총 {course.lectureCount}강</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span>이동재 T</span>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <div className="flex justify-between text-xs font-bold mb-1 text-gray-500">
                                                <span>진도율</span>
                                                <span className="text-black">35%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-black group-hover:bg-blue-600 h-full transition-colors" style={{ width: '35%' }}></div>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="pt-0 relative z-10">
                                        <div className="w-full flex items-center justify-between text-sm font-bold text-gray-400 group-hover:text-black transition-colors mt-2">
                                            <span>강의실 입장하기</span>
                                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <div className="mb-4">등록된 강좌가 없습니다.</div>
                        <Link href="/questions">
                            <Button variant="outline">수강 신청 문의하기</Button>
                        </Link>
                    </div>
                )}
            </section>
        </div>
    )
}
