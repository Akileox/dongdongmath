'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, TrendingUp, Award, Clock, PlayCircle, CheckSquare, Calendar as CalendarIcon, LogOut, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { ScoreChart } from "@/components/dashboard/score-chart"
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUserRole } from "@/hooks/use-user-role"
import { Input } from "@/components/ui/input"

const CourseCard = ({ course, hideGradeTag }: { course: any, hideGradeTag?: boolean }) => {
    const displaySection = hideGradeTag ? course.section.replace(/\[.*?\]\s*/, '') : course.section

    return (
        <Link href={`/dashboard/lectures/${course.id}`} className="block group h-full">
            <div className="h-full flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {course.youtube_link ? (
                        <img
                            src={`https://img.youtube.com/vi/${course.youtube_link.split('v=')[1]?.split('&')[0]}/mqdefault.jpg`}
                            alt={course.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <PlayCircle className="w-10 h-10 opacity-50" />
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <PlayCircle className="text-white w-12 h-12 drop-shadow-lg" />
                    </div>
                </div>
                <div className="p-4 flex-1 flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none whitespace-nowrap">
                            {displaySection}
                        </Badge>
                    </div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-base line-clamp-1">
                        {course.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">
                        {course.description || '강의 설명이 없습니다.'}
                    </p>
                </div>
            </div>
        </Link>
    )
}


export function DashboardClient() {
    const [stats, setStats] = useState({
        avgScore: 0,
        topPercent: 0, // Mock for now or calc
        recentDays: 0,
        totalQuestions: 0
    })
    const [examResults, setExamResults] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')
    const [courses, setCourses] = useState<any[]>([])
    const [todos, setTodos] = useState<any[]>([])
    const [newTodo, setNewTodo] = useState('')
    const [addingTodo, setAddingTodo] = useState(false)

    const supabase = createClient()
    const router = useRouter()
    const { isAdmin, user } = useUserRole()

    useEffect(() => {
        if (!user) return

        async function loadData() {
            setUserName(user?.user_metadata?.name || '학생')

            try {
                // 1. Fetch Lectures (Group by Section)
                const { data: lecturesData } = await supabase
                    .from('lectures')
                    .select('*')
                    .order('created_at', { ascending: true })

                if (lecturesData) {
                    const sectionMap = new Map()
                    lecturesData.forEach(lecture => {
                        if (!sectionMap.has(lecture.section)) {
                            sectionMap.set(lecture.section, lecture)
                        }
                    })
                    setCourses(Array.from(sectionMap.values()))
                }

                // 2. Fetch Exam Results
                const { data: resultsData } = await supabase
                    .from('exam_results')
                    .select(`
                        id,
                        score,
                        rank,
                        exams (title, exam_date, total_score)
                    `)
                    .eq('student_id', user!.id)
                    .order('exams(exam_date)', { ascending: true })
                    .limit(10)

                if (resultsData && resultsData.length > 0) {
                    const params = resultsData.map((item: any) => ({
                        date: new Date(item.exams.exam_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
                        score: item.score,
                        average: 0,
                        title: item.exams.title,
                        fullDate: item.exams.exam_date,
                        id: item.id
                    }))
                    setExamResults(params)

                    const avg = params.reduce((acc: number, cur: any) => acc + cur.score, 0) / params.length
                    setStats(prev => ({ ...prev, avgScore: Math.round(avg * 10) / 10 }))
                }

                // 3. Fetch Todos
                const { data: todoData } = await supabase
                    .from('todos')
                    .select('*')
                    .eq('user_id', user!.id)
                    .order('created_at', { ascending: false })
                if (todoData) setTodos(todoData)

                // 4. Fetch Question Count
                const { count: questionCount } = await supabase
                    .from('questions')
                    .select('*', { count: 'exact', head: true })
                    .eq('author_id', user!.id)

                // 5. Fetch Recent Learning (Learning History) - if implemented, else mock logic from lectures
                // Assuming learning_history table or similar
                // const { data: history } = await supabase.from('learning_history').select('last_watched_at').eq('user_id', user!.id).order('last_watched_at', { ascending: false }).limit(1)
                // Using 0 for now as table might be empty
                setStats(prev => ({ ...prev, totalQuestions: questionCount || 0, recentDays: 0 }))

            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [supabase, user])

    const handleAddTodo = async () => {
        if (!newTodo.trim() || !user) return
        const { data, error } = await supabase.from('todos').insert({
            content: newTodo,
            user_id: user.id,
            is_done: false
        }).select().single()

        if (error) {
            alert('할 일을 저장하지 못했습니다. 관리자에게 문의하세요.')
            console.error(error)
            return
        }

        if (data) {
            setTodos([data, ...todos])
            setNewTodo('')
            setAddingTodo(false)
        }
    }

    const toggleTodo = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase.from('todos').update({ is_done: !currentStatus }).eq('id', id)
        if (!error) {
            setTodos(todos.map(t => t.id === id ? { ...t, is_done: !currentStatus } : t))
        }
    }

    const deleteTodo = async (id: string) => {
        const { error } = await supabase.from('todos').delete().eq('id', id)
        if (!error) {
            setTodos(todos.filter(t => t.id !== id))
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <h1 className="font-bold text-xl flex items-center gap-2">
                        <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-lg">D</span>
                        학습 대시보드
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                            <span className="font-bold text-gray-900">{userName}</span>님, 환영합니다!
                        </div>
                        {isAdmin ? (
                            <Button variant="default" size="sm" className="rounded-full bg-slate-800 hover:bg-slate-700" onClick={() => router.push('/admin')}>
                                관리자 대시보드
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.push('/')}>
                                메인으로
                            </Button>
                        )}
                        {/* <Button variant="ghost" size="icon" onClick={() => { supabase.auth.signOut(); router.push('/login') }} className="text-gray-400 hover:text-red-500">
                            <LogOut className="w-4 h-4" />
                        </Button> */}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">평균 점수</CardTitle>
                            <TrendingUp className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-gray-900">{stats.avgScore}<span className="text-sm text-gray-400 font-normal ml-1">점</span></div>
                            <p className="text-xs text-red-500 font-medium mt-1">
                                +4.2% <span className="text-gray-400 font-normal">지난달 대비 (준비중)</span>
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">상위 백분위</CardTitle>
                            <Award className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-gray-900">{stats.topPercent || '-'}<span className="text-sm text-gray-400 font-normal ml-1">%</span></div>
                            <p className="text-xs text-blue-500 font-medium mt-1">
                                안정권 <span className="text-gray-400 font-normal">1등급 유지 중 (준비중)</span>
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">최근 학습</CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-gray-900">{stats.recentDays}<span className="text-sm text-gray-400 font-normal ml-1">일 전</span></div>
                            <p className="text-xs text-gray-400 mt-1">
                                마지막 활동이 없습니다.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">질문 내역</CardTitle>
                            <BookOpen className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-gray-900">{stats.totalQuestions}<span className="text-sm text-gray-400 font-normal ml-1">건</span></div>
                            <p className="text-xs text-purple-500 font-medium mt-1">
                                적극적인 학습 중
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* My Courses (Sections) */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <BookOpen className="text-blue-600 w-5 h-5" />
                            수강 중인 강좌
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading && <div className="text-center text-gray-400">강좌 정보를 불러오는 중입니다...</div>}

                        {!loading && courses.length === 0 && (
                            <div className="text-center text-gray-400">
                                <p>수강 중인 강좌가 없습니다.</p>
                            </div>
                        )}

                        {!loading && courses.length > 0 && (
                            <Tabs defaultValue="all" className="w-full">
                                <TabsList className="mb-6 h-auto p-1 bg-gray-100/50 rounded-lg">
                                    <TabsTrigger value="all" className="px-4 py-2 rounded-md font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">전체</TabsTrigger>
                                    {['고1', '고2', '고3', '기타'].filter(grade => courses.some(c => c.section.includes(`[${grade}]`))).map(grade => (
                                        <TabsTrigger key={grade} value={grade} className="px-4 py-2 rounded-md font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                                            {grade}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {/* All Tab */}
                                <TabsContent value="all" className="mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {courses.map((course, i) => (
                                            <CourseCard key={course.id} course={course} />
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* Grade Tabs */}
                                {['고1', '고2', '고3', '기타'].map(grade => (
                                    <TabsContent key={grade} value={grade} className="mt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {courses.filter(c => c.section.includes(`[${grade}]`)).map((course) => (
                                                <CourseCard key={course.id} course={course} hideGradeTag />
                                            ))}
                                            {courses.filter(c => c.section.includes(`[${grade}]`)).length === 0 && (
                                                <div className="col-span-full text-center py-10 text-gray-400">
                                                    강좌가 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-sm h-[400px]">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">📈 성적 변화 추이</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                                        <span className="text-gray-400 text-sm">로딩 중...</span>
                                    </div>
                                ) : (
                                    <div className="h-[300px] relative">
                                        <ScoreChart data={examResults} />
                                        {examResults.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-gray-400">성적 데이터가 없습니다.</div>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Reports */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">최근 성적 리포트</h3>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">전체보기</Button>
                            </div>
                            <div className="grid gap-3">
                                {examResults.slice().reverse().slice(0, 3).map((item, i) => (
                                    <Link href={`/dashboard/report/${item.id}`} key={i} className="group block bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {item.score}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                                                    <p className="text-xs text-gray-400">{item.fullDate} • 평균 {item.average}점</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="text-gray-300 group-hover:text-blue-500 transition-colors w-5 h-5" />
                                        </div>
                                    </Link>
                                ))}
                                {examResults.length === 0 && !loading && (
                                    <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                                        응시한 시험이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Side Panel: Weak Points & AI */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16 blur-xl"></div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    🤖 AI 분석 리포트
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-indigo-100 text-sm font-medium">취약 유형</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold backdrop-blur-sm">삼각함수의 활용</span>
                                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold backdrop-blur-sm">등차수열의 합</span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-white/20">
                                    <p className="text-base font-bold leading-snug">
                                        "지난달보다 계산 실수가 15% 줄었습니다! 👏"
                                    </p>
                                    <Button size="sm" variant="secondary" className="w-full mt-4 bg-white text-indigo-700 hover:bg-indigo-50 font-bold border-none">
                                        맞춤 문제 풀러가기
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-gray-500 flex items-center justify-between">
                                    <span>To-Do List</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddingTodo(true)}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {addingTodo && (
                                        <div className="flex gap-2 mb-2">
                                            <Input
                                                value={newTodo}
                                                onChange={e => setNewTodo(e.target.value)}
                                                placeholder="할 일을 입력하세요"
                                                className="h-8 text-sm"
                                                onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                                            />
                                            <Button size="sm" onClick={handleAddTodo} className="h-8">추가</Button>
                                        </div>
                                    )}
                                    {todos.map((todo) => (
                                        <div key={todo.id} className="flex items-start gap-3 group">
                                            <div
                                                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${todo.is_done ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-500'}`}
                                                onClick={() => toggleTodo(todo.id, todo.is_done)}
                                            >
                                                {todo.is_done && <CheckSquare className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm ${todo.is_done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{todo.content}</p>
                                                <p className="text-[10px] mt-0.5 text-gray-400">{new Date(todo.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500" onClick={() => deleteTodo(todo.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    {todos.length === 0 && !addingTodo && (
                                        <div className="text-center text-xs text-gray-400 py-4 cursor-pointer" onClick={() => setAddingTodo(true)}>
                                            + 할 일 추가하기
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
