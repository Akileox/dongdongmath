import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Users, Shield } from "lucide-react"

type Student = {
    id: string
    full_name: string
    phone: string
    grade?: string
    school?: string
    class_section?: string // Added
    role: string
    permissions: any
    attendance_status?: string // Joined from attendance table
}

export function ClassManager() {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const supabase = createClient()

    const fetchData = async () => {
        setLoading(true)
        // 1. Fetch all students via Admin API (Bypass RLS)
        const res = await fetch('/api/admin/students')
        const { profiles, error: apiError } = await res.json()

        if (apiError) {
            console.error(apiError)
            setLoading(false)
            return
        }

        // 2. Filter only students (Exclude admin/assistant)
        const studentsOnly = profiles.filter((p: any) => p.role === 'student').sort((a: any, b: any) => (a.full_name || '').localeCompare(b.full_name || ''))

        // 3. Fetch attendance for date (Direct DB call, assuming RLS for attendance allows admin update/read)
        // If this fails, I will need to move it to API too. Let's try mixed first as Profile RLS was the specific blocker.
        const { data: attendance } = await supabase
            .from('attendance')
            .select('student_id, status')
            .eq('date', date)

        // Merge
        const merged = studentsOnly.map((p: any) => ({
            ...p,
            attendance_status: attendance?.find(a => a.student_id === p.id)?.status || 'none'
        }))

        setStudents(merged)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [date])

    const toggleAttendance = async (studentId: string, currentStatus: string) => {
        // Cycle: none -> present -> late -> absent -> none
        const cycle = ['none', 'present', 'late', 'absent']
        const nextIndex = (cycle.indexOf(currentStatus) + 1) % cycle.length
        const nextStatus = cycle[nextIndex]

        // Optimistic Update
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, attendance_status: nextStatus } : s))

        try {
            const res = await fetch('/api/admin/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, date, status: nextStatus })
            })
            if (!res.ok) throw new Error('Update failed')
        } catch (error) {
            console.error(error)
            alert('출석 업데이트 실패')
            // Rollback
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, attendance_status: currentStatus } : s))
        }
    }

    const togglePermission = async (studentId: string, currentRole: string) => {
        const newRole = currentRole === 'assistant' ? 'student' : 'assistant'

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', studentId)

        if (!error) {
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, role: newRole } : s))
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present': return <Badge className="bg-green-500 hover:bg-green-600 text-white">출석</Badge>
            case 'late': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">지각</Badge>
            case 'absent': return <Badge className="bg-red-500 hover:bg-red-600 text-white">결석</Badge>
            default: return <Badge variant="outline" className="text-gray-400">미체크</Badge>
        }
    }

    return (
        <Card className="glass border-white/10">
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        학생 출석부
                    </CardTitle>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border rounded px-2 py-1 text-sm bg-white/50"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-gray-500 font-medium border-b">
                            <tr>
                                <th className="text-left py-3 px-2 w-[100px]">학교</th>
                                <th className="text-center py-3 px-2 w-[80px]">학년</th>
                                <th className="text-left py-3 px-2 w-[100px]">이름</th>
                                <th className="text-left py-3 px-2">분반 (Class)</th>
                                <th className="text-center py-3 px-2 w-[80px]">출석</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3 px-2 text-gray-600">
                                        {student.school || '-'}
                                    </td>
                                    <td className="py-3 px-2 text-center text-gray-400 text-xs">
                                        {student.grade || '-'}
                                    </td>
                                    <td className="py-3 px-2 font-medium">
                                        {student.full_name}
                                        <div className="text-xs text-gray-400 font-light">{(student.phone || '').slice(-4)}</div>
                                    </td>
                                    <td className="py-3 px-2 text-gray-800 font-bold">
                                        {student.class_section || <span className="text-gray-300 font-normal">미배정</span>}
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <button onClick={() => toggleAttendance(student.id, student.attendance_status || 'none')}>
                                            {getStatusBadge(student.attendance_status || 'none')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {students.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-400">등록된 학생이 없습니다.</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
