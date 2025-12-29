'use client'

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from 'next/link'
import { ClassManager } from "@/components/admin/class-manager"
import { ScoreInputGrid } from "@/components/admin/score-input-grid"
import { StudentManager } from "@/components/admin/student-manager"
import { QnaManager } from "@/components/admin/qna-manager"
import { NoticeManager } from "@/components/admin/notice-manager"
import { LectureManager } from "@/components/admin/lecture-manager"

export default function AdminPage() {
    return (
        <div className="max-w-[1400px] mx-auto py-10 px-6 space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-sans text-gray-900">관리자 대시보드</h1>
                    <p className="text-gray-500 mt-2">학원 운영에 필요한 모든 기능을 관리합니다.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard">
                        <Button variant="outline">🏠 학생 대시보드로 이동</Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="attendance" className="w-full">
                <TabsList className="w-full justify-start h-auto p-2 bg-white border mb-6 flex-wrap gap-2">
                    <TabsTrigger value="attendance" className="px-4 py-2">📅 출석부</TabsTrigger>
                    <TabsTrigger value="members" className="px-4 py-2">👥 스태프 & 반 배정</TabsTrigger>
                    <TabsTrigger value="scores" className="px-4 py-2">🏆 성적 관리</TabsTrigger>
                    <TabsTrigger value="content" className="px-4 py-2">📺 수업/영상 관리</TabsTrigger>
                    <TabsTrigger value="notices" className="px-4 py-2">📢 공지사항</TabsTrigger>
                    <TabsTrigger value="qna" className="px-4 py-2">💬 질문 관리 (Q&A)</TabsTrigger>
                </TabsList>

                {/* 1. 출석부 */}
                <TabsContent value="attendance" className="space-y-4">
                    <div className="flex justify-end p-2 bg-blue-50 rounded text-blue-800 text-sm mb-2">
                        <span className="font-bold mr-2">Tip:</span> 학생들의 등/하원 및 일일 출석 상태를 체크하는 공간입니다.
                    </div>
                    <ClassManager />
                </TabsContent>

                {/* 2. 구성원 & 반 배정 */}
                <TabsContent value="members" className="space-y-4">
                    <div className="flex justify-end p-2 bg-blue-50 rounded text-blue-800 text-sm mb-2">
                        <span className="font-bold mr-2">Tip:</span> 학생/조교 등록, 엑셀 일괄 업로드, 그리고 <strong>Drag & Drop 반 배정</strong>을 할 수 있습니다.
                    </div>
                    <StudentManager />
                </TabsContent>

                {/* 3. 성적 관리 */}
                <TabsContent value="scores" className="space-y-4">
                    <ScoreInputGrid />
                </TabsContent>

                {/* 4. 수업/영상 (YouTube) */}
                <TabsContent value="content" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>유튜브 강의 관리 (준비 중)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-10 border-2 border-dashed rounded-xl text-center text-gray-400">
                                <h3 className="text-lg font-bold text-gray-600 mb-2">재생목록 통합 등록 기능 개발 예정</h3>
                                <p>유튜브 재생목록 링크를 입력하면 자동으로 강의 목차를 생성하고 영상을 등록하는 기능을 준비하고 있습니다.</p>
                                <Button variant="blue" className="mt-4" disabled>기능 준비 중</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Manual Registration */}
                    <div className="mt-6 border-t pt-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">수동 개별 등록</h3>
                        <LectureManager />
                    </div>
                </TabsContent>

                {/* 5. 운영 (공지/Q&A) */}
                <TabsContent value="notices" className="space-y-4">
                    <div className="flex justify-end p-2 bg-blue-50 rounded text-blue-800 text-sm mb-2">
                        <span className="font-bold mr-2">Tip:</span> 공지사항을 작성하면 학생 대시보드 및 공지사항 게시판에 즉시 반영됩니다.
                    </div>
                    <NoticeManager />
                </TabsContent>

                <TabsContent value="qna" className="space-y-4">
                    <div className="flex justify-end p-2 bg-blue-50 rounded text-blue-800 text-sm mb-2">
                        <span className="font-bold mr-2">Tip:</span> 학생들의 질문에 답변을 달아주세요. (답변 완료 시 학생에게 알림이 가지는 않습니다 - 추후 개발 예정)
                    </div>
                    <QnaManager />
                </TabsContent>
            </Tabs>
        </div>
    )
}
