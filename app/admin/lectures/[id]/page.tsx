'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from 'next/navigation'
import { LecturePlayer } from "@/components/player/lecture-player"
import { QuestionList } from "@/components/questions/question-list"
import { useUserRole } from "@/hooks/use-user-role"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, HelpCircle, AlertCircle, Edit, Save, X, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
// import { useToast } from "@/components/ui/use-toast"


import Link from 'next/link'
import { cn } from "@/lib/utils"
import { PlayCircle, CheckCircle2 } from "lucide-react"

interface Lecture {
    id: string
    title: string
    youtube_link: string
    description: string
    section: string
    learning_guide?: string
    created_at: string
}

export default function AdminLecturePage() {
    const params = useParams()
    const id = params.id as string
    const [lecture, setLecture] = useState<Lecture | null>(null)
    const [playlist, setPlaylist] = useState<Lecture[]>([])
    const { user } = useUserRole()
    const supabase = createClient()
    const router = useRouter()

    // Edit State
    const [isEditingGuide, setIsEditingGuide] = useState(false)
    const [guideContent, setGuideContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        async function fetchData() {
            // 1. Fetch Current Lecture
            const { data: currentLecture } = await supabase.from('lectures').select('*').eq('id', id).single()

            if (currentLecture) {
                setLecture(currentLecture)
                setGuideContent(currentLecture.learning_guide || '')

                // 2. Fetch Playlist (Same Section)
                const { data: sectionLectures } = await supabase
                    .from('lectures')
                    .select('*')
                    .eq('section', currentLecture.section)
                    .order('created_at', { ascending: true })

                if (sectionLectures) setPlaylist(sectionLectures)
            }
        }
        fetchData()
    }, [id, supabase])

    const handleSaveGuide = async () => {
        if (!lecture) return
        setIsSaving(true)
        const { error } = await supabase
            .from('lectures')
            .update({ learning_guide: guideContent })
            .eq('id', lecture.id)

        if (!error) {
            setLecture({ ...lecture, learning_guide: guideContent })
            setIsEditingGuide(false)
            router.refresh()
        } else {
            console.error('Failed to save guide:', error)
            alert('저장 중 오류가 발생했습니다: ' + error.message)
        }
        setIsSaving(false)
    }

    const [activeTab, setActiveTab] = useState("intro")
    const [qaTimestamp, setQaTimestamp] = useState<number | undefined>(undefined)

    const handleTimeCapture = (time: number) => {
        setActiveTab("qa")
        setQaTimestamp(time)
        const tabsElement = document.getElementById("lecture-tabs")
        if (tabsElement) {
            tabsElement.scrollIntoView({ behavior: "smooth" })
        }
    }

    if (!lecture) return <div className="p-8 text-center text-gray-500">강의 정보를 불러오는 중입니다...</div>

    return (
        <div className="max-w-[1600px] mx-auto pb-20 px-4 md:px-8 flex flex-col lg:flex-row gap-8 pt-8">

            {/* LEFT SIDEBAR: Playlist */}
            <aside className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1">
                <div className="mb-4">
                    <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-blue-600" onClick={() => router.push('/admin')}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        관리자 목록으로 돌아가기
                    </Button>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm sticky top-24">
                    <div className="bg-gray-50 p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 text-sm">{lecture.section}</h3>
                        <p className="text-xs text-gray-500 mt-1">총 {playlist.length}강 (관리자 뷰)</p>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        {playlist.map((item, index) => {
                            const isActive = item.id === lecture.id
                            return (
                                <Link
                                    key={item.id}
                                    href={`/admin/lectures/${item.id}`}
                                    className={cn(
                                        "block p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group",
                                        isActive ? "bg-blue-50/50 hover:bg-blue-50" : "bg-white"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "mt-0.5",
                                            isActive ? "text-blue-600" : "text-gray-300 group-hover:text-gray-400"
                                        )}>
                                            {isActive ? <PlayCircle size={16} fill="currentColor" className="text-blue-100" /> : <CheckCircle2 size={16} />}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "text-sm mb-1 leading-snug",
                                                isActive ? "font-bold text-blue-700" : "text-gray-700 group-hover:text-gray-900"
                                            )}>
                                                <span className="text-xs text-gray-400 mr-1 font-normal">{index + 1}강.</span>
                                                {item.title}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 order-1 lg:order-2 space-y-8 min-w-0">
                {/* 1. Video Player Section */}
                <LecturePlayer
                    url={lecture.youtube_link}
                    lectureId={lecture.id}
                    userId={user?.id || 'admin'}
                    onTimeCapture={handleTimeCapture}
                />

                {/* 2. Lecture Header Info */}
                <div className="border-b border-gray-200 pb-6 px-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 font-sans tracking-tight">{lecture.title}</h1>
                            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">{lecture.section}</span>
                                <span>&gt;</span>
                                <span>상세 강의 (관리 모드)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Content Tabs */}
                <div id="lecture-tabs">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent h-auto p-0 gap-8 rounded-none px-1">
                            <TabsTrigger
                                value="intro"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:shadow-none py-3 px-1 text-gray-400 font-bold text-base"
                            >
                                강의 소개 및 가이드 설정
                            </TabsTrigger>
                            <TabsTrigger
                                value="materials"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:shadow-none py-3 px-1 text-gray-400 font-bold text-base"
                            >
                                강의 자료
                            </TabsTrigger>
                            <TabsTrigger
                                value="qa"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:shadow-none py-3 px-1 text-gray-400 font-bold text-base"
                            >
                                질문 관리
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab: Intro (Learning Guide) */}
                        <TabsContent value="intro" className="mt-8 space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold flex items-center gap-2 text-xl text-gray-900 font-sans">
                                    <HelpCircle size={24} className="text-black" /> 학습 가이드
                                </h3>
                                {!isEditingGuide && (
                                    <Button onClick={() => setIsEditingGuide(true)} variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                                        <Edit size={16} /> 가이드 수정하기
                                    </Button>
                                )}
                            </div>

                            {isEditingGuide ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all animate-in fade-in zoom-in-95">
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">학습 가이드 내용</label>
                                        <Textarea
                                            value={guideContent}
                                            onChange={(e) => setGuideContent(e.target.value)}
                                            className="min-h-[300px] bg-white text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base leading-relaxed p-4 resize-none"
                                            placeholder="이 강의에 대한 학습 가이드, 예습 복습 포인트, 선생님의 코멘트 등을 작성해주세요."
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" onClick={() => setIsEditingGuide(false)} disabled={isSaving} className="text-gray-500 hover:text-gray-700">취소</Button>
                                        <Button onClick={handleSaveGuide} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6">
                                            {isSaving ? '저장 중...' : <><Save size={16} /> 저장하기</>}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                lecture.learning_guide ? (
                                    <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                                            {lecture.learning_guide}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm text-center flex flex-col items-center gap-4">
                                        <p>등록된 학습 가이드가 없습니다.</p>
                                        <Button onClick={() => setIsEditingGuide(true)} variant="outline" size="sm">
                                            가이드 등록하기
                                        </Button>
                                    </div>
                                )
                            )}
                        </TabsContent>

                        {/* Tab: Materials */}
                        <TabsContent value="materials" className="mt-8">
                            {/* Similar Edit Logic could be applied here later */}
                            <div className="p-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
                                <FileText className="mx-auto mb-4 opacity-30 w-12 h-12" />
                                <p className="text-lg font-medium">등록된 강의 자료가 없습니다.</p>
                                <p className="text-sm mt-2 opacity-70">강의 자료 업로드 기능은 준비 중입니다.</p>
                            </div>
                        </TabsContent>

                        {/* Tab: Q&A */}
                        <TabsContent value="qa" className="mt-8">
                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="md:col-span-2">
                                    <QuestionList
                                        lectureId={lecture.id}
                                        initialTimestamp={qaTimestamp}
                                        onClearTimestamp={() => setQaTimestamp(undefined)}
                                    />
                                </div>
                                <div className="hidden md:block p-6 bg-gray-50 rounded-2xl h-fit border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <AlertCircle size={16} /> 관리자 안내
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        학생들이 남긴 질문을 확인하고 답변을 작성할 수 있습니다.
                                        시간 타임스탬프를 클릭하여 해당 영상 위치를 확인할 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
