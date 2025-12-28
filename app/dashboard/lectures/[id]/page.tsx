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
}

export default function LecturePage() {
    const params = useParams()
    const id = params.id as string
    const [lecture, setLecture] = useState<Lecture | null>(null)
    const { user } = useUserRole()
    const supabase = createClient()

    useEffect(() => {
        async function fetchLecture() {
            const { data } = await supabase.from('lectures').select('*').eq('id', id).single()
            if (data) setLecture(data)
        }
        fetchLecture()
    }, [id, supabase])

    if (!lecture || !user) return <div className="p-8 text-white">Loading class...</div>

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* 1. Video Player Section */}
            <LecturePlayer
                url={lecture.youtube_link}
                lectureId={lecture.id}
                userId={user.id}
            />

            {/* 2. Lecture Header Info */}
            <div className="border-b border-gray-200 pb-6">
                <h1 className="text-2xl font-bold mb-2 text-gray-900">{lecture.title}</h1>
                <p className="text-gray-500 text-sm font-medium">{lecture.section} &gt; 상세 강의</p>
            </div>

            {/* 3. Content Tabs */}
            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent h-auto p-0 gap-6 rounded-none">
                    <TabsTrigger
                        value="intro"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:shadow-none py-3 px-1 text-gray-400 font-bold"
                    >
                        강의 소개
                    </TabsTrigger>
                    <TabsTrigger
                        value="materials"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:shadow-none py-3 px-1 text-gray-400 font-bold"
                    >
                        강의 자료
                    </TabsTrigger>
                    <TabsTrigger
                        value="qa"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:shadow-none py-3 px-1 text-gray-400 font-bold"
                    >
                        질문하기
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Intro (Learning Guide) */}
                <TabsContent value="intro" className="mt-8 space-y-6">
                    {/* Learning Guide Block */}
                    {lecture.learning_guide ? (
                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                                <HelpCircle size={18} className="text-black" /> 학습 가이드
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {lecture.learning_guide}
                            </p>
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 text-gray-400 text-sm text-center">
                            등록된 학습 가이드가 없습니다.
                        </div>
                    )}
                </TabsContent>

                {/* Tab: Materials */}
                <TabsContent value="materials" className="mt-8">
                    <div className="p-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-gray-400">
                        <FileText className="mx-auto mb-2 opacity-50" />
                        <p>등록된 강의 자료가 없습니다.</p>
                    </div>
                </TabsContent>

                {/* Tab: Q&A */}
                <TabsContent value="qa" className="mt-8">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <QuestionList lectureId={lecture.id} />
                        </div>
                        <div className="hidden md:block p-4 bg-gray-50 rounded-xl h-fit">
                            <h4 className="font-bold text-sm mb-2">질문 작성 팁</h4>
                            <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                                <li>영상 구간을 선택하고 질문하면 선생님이 더 쉽게 답변할 수 있습니다.</li>
                                <li>구체적으로 어느 부분이 이해가 안 가는지 적어주세요.</li>
                            </ul>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
