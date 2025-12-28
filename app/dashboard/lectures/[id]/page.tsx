'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { useParams } from 'next/navigation'
import { LecturePlayer } from "@/components/player/lecture-player"
import { QuestionList } from "@/components/questions/question-list"
import { useUserRole } from "@/hooks/use-user-role"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, HelpCircle, AlertCircle } from "lucide-react"

interface Lecture {
    id: string
    title: string
    youtube_link: string
    description: string
    section: string
    learning_guide?: string
    created_at: string
}

import Link from 'next/link'
import { cn } from "@/lib/utils"
import { PlayCircle, CheckCircle2 } from "lucide-react"

export default function LecturePage() {
    const params = useParams()
    const id = params.id as string
    const [lecture, setLecture] = useState<Lecture | null>(null)
    const [playlist, setPlaylist] = useState<Lecture[]>([])
    const { user } = useUserRole()
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            // 1. Fetch Current Lecture
            const { data: currentLecture } = await supabase.from('lectures').select('*').eq('id', id).single()

            if (currentLecture) {
                setLecture(currentLecture)

                // 2. Fetch Playlist (Same Section)
                const { data: sectionLectures } = await supabase
                    .from('lectures')
                    .select('*')
                    .eq('section', currentLecture.section)
                    .order('created_at', { ascending: true }) // Logical order (1->2->3)

                if (sectionLectures) setPlaylist(sectionLectures)
            }
        }
        fetchData()
    }, [id, supabase])

    const [activeTab, setActiveTab] = useState("intro")
    const [qaTimestamp, setQaTimestamp] = useState<number | undefined>(undefined)

    const handleTimeCapture = (time: number) => {
        setActiveTab("qa")
        setQaTimestamp(time)

        // Scroll to Tabs Section
        const tabsElement = document.getElementById("lecture-tabs")
        if (tabsElement) {
            tabsElement.scrollIntoView({ behavior: "smooth" })
        }
    }

    if (!lecture || !user) return <div className="p-8 text-center text-gray-500">강의 정보를 불러오는 중입니다...</div>

    return (
        <div className="max-w-[1600px] mx-auto pb-20 px-4 md:px-8 flex flex-col lg:flex-row gap-8 pt-8">

            {/* LEFT SIDEBAR: Playlist */}
            <aside className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm sticky top-24">
                    <div className="bg-gray-50 p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 text-sm">{lecture.section}</h3>
                        <p className="text-xs text-gray-500 mt-1">총 {playlist.length}강</p>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        {playlist.map((item, index) => {
                            const isActive = item.id === lecture.id
                            return (
                                <Link
                                    key={item.id}
                                    href={`/dashboard/lectures/${item.id}`}
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
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
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
                    userId={user.id}
                    onTimeCapture={handleTimeCapture}
                />

                {/* 2. Lecture Header Info */}
                <div className="border-b border-gray-200 pb-6 px-1">
                    <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 font-sans tracking-tight">{lecture.title}</h1>
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">{lecture.section}</span>
                        <span>&gt;</span>
                        <span>상세 강의</span>
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
                                강의 소개
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
                                질문하기
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab: Intro (Learning Guide) */}
                        <TabsContent value="intro" className="mt-8 space-y-6">
                            {/* Learning Guide Block */}
                            {lecture.learning_guide ? (
                                <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold mb-6 flex items-center gap-2 text-xl text-gray-900 font-sans">
                                        <HelpCircle size={24} className="text-black" /> 학습 가이드
                                    </h3>
                                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                                        {lecture.learning_guide}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm text-center">
                                    등록된 학습 가이드가 없습니다.
                                </div>
                            )}
                        </TabsContent>

                        {/* Tab: Materials */}
                        <TabsContent value="materials" className="mt-8">
                            <div className="p-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
                                <FileText className="mx-auto mb-4 opacity-30 w-12 h-12" />
                                <p className="text-lg font-medium">등록된 강의 자료가 없습니다.</p>
                                <p className="text-sm mt-2 opacity-70">선생님이 아직 자료를 업로드하지 않았습니다.</p>
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
                                <div className="hidden md:block p-6 bg-blue-50/50 rounded-2xl h-fit border border-blue-100">
                                    <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                        <HelpCircle size={16} /> 질문 작성 Tip
                                    </h4>
                                    <ul className="text-sm text-blue-800/80 space-y-3 list-disc pl-4 leading-relaxed">
                                        <li>영상 플레이어 안의 <strong>[질문하기]</strong> 버튼을 누르면 현재 시간이 자동으로 기록됩니다.</li>
                                        <li>구체적인 시간대와 함께 질문하면 더 정확한 답변을 받을 수 있습니다.</li>
                                        <li>문제 풀이 사진이 있다면 첨부해주세요.</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
