'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Upload, Search, UserPlus, Calendar } from "lucide-react"

import { AssistantSchedule } from "@/components/admin/assistant-schedule"
import { RegistrationList } from "@/components/admin/student-manager/RegistrationList"
import { IndividualRegistration } from "@/components/admin/student-manager/IndividualRegistration"
import { BulkUpload } from "@/components/admin/student-manager/BulkUpload"
import { AssistantRegistration } from "@/components/admin/student-manager/AssistantRegistration"
import { Student } from "./types"

export function StudentManager() {
    const [activeTab, setActiveTab] = useState("list")
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const supabase = createClient()

    // Bulk Upload State
    const [rawText, setRawText] = useState('')
    const [uploadResult, setUploadResult] = useState<{ success: number, fail: number, errors: string[] } | null>(null)

    // Individual Add State
    const [newStudent, setNewStudent] = useState({ name: '', phone: '', grade: '', school: '', role: 'student' })

    // Assistant Register State
    const [newAssistant, setNewAssistant] = useState({ id: '', realName: '', nickname: '', password: '', phone: '' })

    const handleAssistantRegister = async () => {
        if (!newAssistant.id || !newAssistant.realName || !newAssistant.nickname || !newAssistant.password) {
            alert('모든 필수 정보를 입력해주세요.')
            return
        }
        if (newAssistant.password.length < 6) {
            alert('비밀번호는 6자 이상이어야 합니다.')
            return
        }

        setLoading(true)

        // Auto-append ' T'
        let finalNickname = newAssistant.nickname.trim()
        if (!finalNickname.endsWith(' T')) {
            finalNickname += ' T'
        }

        const payload = {
            email: `${newAssistant.id}@teamdj.com`,
            real_name: newAssistant.realName,
            nickname: finalNickname,
            role: 'assistant',
            password: newAssistant.password,
            phone: newAssistant.phone // Optional but good to have
        }

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: [payload] }),
            })
            const data = await res.json()
            if (res.ok && data.results[0].status === 'success') {
                alert('조교 계정이 생성되었습니다.')
                setNewAssistant({ id: '', realName: '', nickname: '', password: '', phone: '' })
                setActiveTab('list')
                fetchStudents()
            } else {
                alert('등록 실패: ' + (data.results[0]?.error || data.error))
            }
        } catch (e) {
            alert('오류 발생')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'list') fetchStudents()
    }, [activeTab])

    const fetchStudents = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/students')
            const { profiles, error } = await res.json()

            if (error) {
                console.error('Fetch error:', error)
                return
            }

            // Client-side filter for search and role
            let data = profiles.filter((p: any) => ['student', 'assistant', 'admin'].includes(p.role))

            if (searchTerm) {
                const lowerTerm = searchTerm.toLowerCase()
                data = data.filter((p: any) =>
                    (p.full_name && p.full_name.toLowerCase().includes(lowerTerm)) ||
                    (p.name && p.name.toLowerCase().includes(lowerTerm))
                )
            }

            // Sort by Role: Admin -> Assistant -> Student
            const rolePriority: Record<string, number> = { 'admin': 0, 'assistant': 1, 'student': 2 }
            data.sort((a: any, b: any) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99))

            console.log('Fetched students via API:', data.length)
            setStudents(data)
        } catch (err) {
            console.error('API Error:', err)
        } finally {
            setLoading(false)
        }
    }


    const handleSync = async () => {
        if (!confirm('데이터베이스 동기화를 진행하시겠습니까? (정보 불일치 강제 업데이트)')) return
        setLoading(true)
        try {
            const res = await fetch('/api/admin/sync', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                alert(`동기화 완료: ${data.results.synced}건 복구됨`)
                fetchStudents()
            } else {
                alert('동기화 실패: ' + data.error)
            }
        } catch (e) {
            alert('동기화 요청 오류')
        } finally {
            setLoading(false)
        }
    }

    const handleBulkUpload = async () => {
        if (!rawText.trim()) return
        setLoading(true)
        setUploadResult(null)

        // Parse Excel Copy-Paste
        const lines = rawText.split('\n').filter(line => line.trim() !== '')
        const usersToCreate = lines.map(line => {
            let parts = line.split('\t')
            if (parts.length < 2) parts = line.split(',') // CSV fallback
            parts = parts.map(p => p.trim())

            const name = parts[0]
            const phone = parts[1]
            const grade = parts[2] || ''
            const school = parts[3] || ''

            if (!name || !phone) return null
            const id = phone.replace(/[^0-9]/g, '')

            return {
                email: `${id}@teamdj.com`,
                name,
                phone,
                grade,
                school,
                role: 'student'
            }
        }).filter(u => u !== null && u.name !== '이름')

        if (usersToCreate.length === 0) {
            setLoading(false)
            alert('데이터 형식이 올바르지 않습니다.')
            return
        }

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: usersToCreate }),
            })
            const data = await res.json()
            if (res.ok) {
                const successes = data.results.filter((r: any) => r.status === 'success').length
                const failures = data.results.filter((r: any) => r.status === 'error')
                setUploadResult({
                    success: successes,
                    fail: failures.length,
                    errors: failures.map((f: any) => `${f.email}: ${f.error}`)
                })
                if (failures.length === 0) setRawText('')
            } else {
                alert(`Error: ${data.error}`)
            }
        } catch (error) {
            alert('Upload failed.')
        } finally {
            setLoading(false)
        }
    }

    const handleIndividualAdd = async () => {
        if (!newStudent.name || !newStudent.phone) {
            alert('이름과 전화번호는 필수입니다.')
            return
        }
        setLoading(true)

        const id = newStudent.phone.replace(/[^0-9]/g, '')

        // Auto-append ' T' for assistants
        let finalName = newStudent.name.trim()
        if (newStudent.role === 'assistant' && !finalName.endsWith(' T')) {
            finalName += ' T'
        }

        const payload = {
            email: `${id}@teamdj.com`,
            name: finalName,
            phone: newStudent.phone,
            grade: newStudent.grade,
            school: newStudent.school,
            role: newStudent.role
        }

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: [payload] }),
            })
            const data = await res.json()
            if (res.ok && data.results[0].status === 'success') {
                alert('등록되었습니다.')
                setNewStudent({ name: '', phone: '', grade: '', school: '', role: 'student' })
                setActiveTab('list')
            } else {
                alert('등록 실패: ' + (data.results[0]?.error || data.error))
            }
        } catch (e) {
            alert('등록 중 오류 발생')
        } finally {
            setLoading(false)
        }
    }

    const handleEditCell = async (id: string, field: keyof Student, value: string) => {
        // Optimistic update
        setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))

        try {
            const res = await fetch('/api/admin/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, updates: { [field]: value } })
            })
            if (!res.ok) {
                const data = await res.json()
                console.error('Update failed:', data.error)
                alert('저장 실패: ' + data.error)
                // Rollback could be added here
            }
        } catch (e) {
            console.error('Update error:', e)
            alert('저장 중 오류 발생')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 사용자를 삭제하시겠습니까? (되돌릴 수 없습니다)')) return

        // Delete from profiles (auth.users linkage might remain if not cascading, but profiles is main view)
        // Ideally should delete from auth.users via server admin API, but client can only delete from public tables
        const { error } = await supabase.from('profiles').delete().eq('id', id)

        if (error) {
            alert('삭제 실패: ' + error.message)
        } else {
            setStudents(prev => prev.filter(s => s.id !== id))
        }
    }

    return (
        <Card className="glass border-white/10">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        학생 및 조교 관리
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-gray-100 p-1 mb-4">
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <Search className="w-4 h-4" /> 등록 목록
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> 조교 근무표
                        </TabsTrigger>
                        <TabsTrigger value="assistant_register" className="flex items-center gap-2">
                            <Users className="w-4 h-4" /> 조교 등록
                        </TabsTrigger>
                        <TabsTrigger value="individual" className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> 개별 등록
                        </TabsTrigger>
                        <TabsTrigger value="bulk" className="flex items-center gap-2">
                            <Upload className="w-4 h-4" /> 엑셀 일괄 등록
                        </TabsTrigger>
                        <Button variant="outline" size="sm" onClick={handleSync} className="ml-auto bg-white border-blue-200 text-blue-600 hover:bg-blue-50">
                            🔄 DB 동기화 (오류 해결)
                        </Button>
                    </TabsList>

                    <TabsContent value="list" className="space-y-4">
                        <RegistrationList
                            students={students}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            fetchStudents={fetchStudents}
                            handleEditCell={handleEditCell}
                            handleDelete={handleDelete}
                        />
                    </TabsContent>

                    <TabsContent value="schedule" className="space-y-4">
                        <AssistantSchedule />
                    </TabsContent>

                    <TabsContent value="assistant_register" className="space-y-4">
                        <AssistantRegistration
                            newAssistant={newAssistant}
                            setNewAssistant={setNewAssistant}
                            handleAssistantRegister={handleAssistantRegister}
                            loading={loading}
                        />
                    </TabsContent>

                    <TabsContent value="individual" className="space-y-4">
                        <IndividualRegistration
                            newStudent={newStudent}
                            setNewStudent={setNewStudent}
                            handleIndividualAdd={handleIndividualAdd}
                            loading={loading}
                        />
                    </TabsContent>

                    <TabsContent value="bulk" className="space-y-4">
                        <BulkUpload
                            rawText={rawText}
                            setRawText={setRawText}
                            handleBulkUpload={handleBulkUpload}
                            loading={loading}
                            uploadResult={uploadResult}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
