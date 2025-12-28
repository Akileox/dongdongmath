'use client'

import { useUserRole } from "@/hooks/use-user-role"
import { LectureManager } from "@/components/admin/lecture-manager"
import { StudentManager } from "@/components/admin/student-manager"
import { NoticeManager } from "@/components/admin/notice-manager"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentDashboardPreview } from "@/components/admin/preview/student-dashboard-preview"
import { LecturePreview } from "@/components/admin/preview/lecture-preview"
import { QAPreview } from "@/components/admin/preview/qa-preview"

export default function AdminPage() {
    const { role, loading } = useUserRole()
    const router = useRouter()

    // Tab State
    const [activeTab, setActiveTab] = useState("dashboard")

    useEffect(() => {
        if (!loading && role !== 'admin' && role !== 'assistant') {
            // Ideally we redirect, but for now just show access denied
            // router.push('/dashboard')
        }
    }, [role, loading, router])

    // Temporary Bypass for Testing
    if (loading) return <div>로딩 중...</div>
    if (role !== 'admin' && role !== 'assistant') return <div className="p-10 text-red-500">접근 거부: 권한이 없습니다.</div>

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">관리자 대시보드</h1>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Admin Mode</span>
            </div>

            <Tabs defaultValue="dashboard" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 lg:w-[800px]">
                    <TabsTrigger value="dashboard">관리 홈</TabsTrigger>
                    <TabsTrigger value="notice">공지관리</TabsTrigger>
                    <TabsTrigger value="qa">질문관리</TabsTrigger>
                    <TabsTrigger value="preview-mypage">마이페이지(예시)</TabsTrigger>
                    <TabsTrigger value="preview-lecture">강의화면(예시)</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <LectureManager />
                        <div className="p-6 border border-white/10 rounded-xl bg-white/5 backdrop-blur-md">
                            <h2 className="text-xl font-semibold mb-4">학생 관리</h2>
                            <StudentManager />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="notice" className="mt-6">
                    <NoticeManager />
                </TabsContent>

                <TabsContent value="qa" className="mt-6">
                    {/* Reuse QAPreview for now or build a real manager later */}
                    <div className="p-4 bg-gray-50 rounded">
                        <h3 className="font-bold mb-4">질문 관리 (Real DB)</h3>
                        <p className="text-gray-500 mb-4">이곳에서 학생들의 질문을 확인하고 답변을 달 수 있습니다. (추후 구현 예정)</p>
                        <QAPreview />
                    </div>
                </TabsContent>

                <TabsContent value="preview-mypage" className="mt-6">
                    <StudentDashboardPreview />
                </TabsContent>

                <TabsContent value="preview-lecture" className="mt-6">
                    <LecturePreview />
                </TabsContent>
            </Tabs>
        </div>
    )
}
