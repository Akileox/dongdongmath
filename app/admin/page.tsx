'use client'

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClassManager } from "@/components/admin/class-manager"
import { StudentManager } from "@/components/admin/student-manager"
import { QnaManager } from "@/components/admin/qna-manager"
import { NoticeManager } from "@/components/admin/notice-manager"
import { LectureManager } from "@/components/admin/lecture-manager"
import { ExamManager } from "@/components/admin/exam-manager"
import { AssignmentManager } from "@/components/admin/assignment-manager"
import { LearningLogManager } from "@/components/admin/learning-log-manager"

export default function AdminPage() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

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
                    <Button variant="destructive" onClick={handleLogout}>로그아웃</Button>
                </div>
            </div>

            <Tabs defaultValue="attendance" className="w-full">
                <TabsList className="w-full justify-start h-auto p-2 bg-white border mb-6 flex-wrap gap-2">
                    <TabsTrigger value="attendance" className="px-4 py-2">📅 출석부</TabsTrigger>
                    <TabsTrigger value="members" className="px-4 py-2">👥 스태프 & 반 배정</TabsTrigger>
                    <TabsTrigger value="scores" className="px-4 py-2">🏆 성적 관리</TabsTrigger>
                    <TabsTrigger value="assignments" className="px-4 py-2">📝 과제 관리</TabsTrigger>
                    <TabsTrigger value="content" className="px-4 py-2">📺 수업/영상 관리</TabsTrigger>
                    <TabsTrigger value="qna" className="px-4 py-2">💬 질문 관리 (Q&A)</TabsTrigger>
                    <TabsTrigger value="notices" className="px-4 py-2">📢 공지사항</TabsTrigger>
                    <TabsTrigger value="learning" className="px-4 py-2">📊 학습 리포트 (New)</TabsTrigger>
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
                    <ExamManager />
                </TabsContent>

                {/* 3.5 과제 관리 */}
                <TabsContent value="assignments" className="space-y-4">
                    <div className="flex justify-end p-2 bg-blue-50 rounded text-blue-800 text-sm mb-2">
                        <span className="font-bold mr-2">Tip:</span> 수업(분반)별로 과제를 배포하면 학생들의 할 일(Todo) 목록에 자동으로 등록됩니다.
                    </div>
                    <AssignmentManager />
                </TabsContent>

                {/* 4. 수업/영상 (YouTube) */}
                <TabsContent value="content" className="space-y-4">
                    <LectureManager />
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

                {/* 6. 학습 리포트 (New) */}
                <TabsContent value="learning" className="space-y-4">
                    <div className="flex justify-end p-2 bg-blue-50 rounded text-blue-800 text-sm mb-2">
                        <span className="font-bold mr-2">Tip:</span> 각 분반별로 오늘 진행한 학습 내용과 코멘트를 작성하면 학생들의 일일 리포트에 자동 반영됩니다.
                    </div>
                    <LearningLogManager />
                </TabsContent>
            </Tabs>
        </div>
    )
}
