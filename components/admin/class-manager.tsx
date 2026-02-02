import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Student = {
    id: string
    full_name: string
    phone: string
    grade?: string
    school?: string
    class_section?: string
    role: string
    permissions: any
    attendance_status?: string
}

export function ClassManager() {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedClass, setSelectedClass] = useState<string>('all')
    const supabase = createClient()

    const fetchData = async () => {
        setLoading(true)
        const res = await fetch('/api/admin/students')
        const { profiles, error: apiError } = await res.json()

        if (apiError) {
            console.error(apiError)
            setLoading(false)
            return
        }

        const studentsOnly = profiles
            .filter((p: any) => p.role === 'student')
            .sort((a: any, b: any) => {
                const classA = a.class_section || 'ZZZ'
                const classB = b.class_section || 'ZZZ'
                if (classA !== classB) return classA.localeCompare(classB)
                return (a.full_name || '').localeCompare(b.full_name || '')
            })

        const { data: attendance } = await supabase
            .from('attendance')
            .select('user_id, status')
            .eq('date', date)

        const merged = studentsOnly.map((p: any) => ({
            ...p,
            attendance_status: attendance?.find(a => a.user_id === p.id)?.status || 'none'
        }))

        setStudents(merged)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [date])

    const uniqueClasses = useMemo(() => {
        const classes = new Set(students.map(s => s.class_section).filter(Boolean))
        return Array.from(classes).sort() as string[]
    }, [students])

    const filteredStudents = useMemo(() => {
        if (selectedClass === 'all') return students
        return students.filter(s => s.class_section === selectedClass)
    }, [students, selectedClass])

    const toggleAttendance = async (studentId: string, currentStatus: string) => {
        const cycle = ['none', 'present', 'late', 'absent']
        const nextIndex = (cycle.indexOf(currentStatus) + 1) % cycle.length
        const nextStatus = cycle[nextIndex]

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
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, attendance_status: currentStatus } : s))
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="w-5 h-5" />
                        학생 출석부
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-white/50 p-1 rounded-md border border-gray-100">
                            <Filter className="w-4 h-4 text-gray-500 ml-2" />
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="w-[180px] h-8 border-none bg-transparent shadow-none focus:ring-0">
                                    <SelectValue placeholder="모든 분반" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체 보기 ({students.length}명)</SelectItem>
                                    {uniqueClasses.map(cls => (
                                        <SelectItem key={cls} value={cls}>{cls}반</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border rounded px-3 py-1.5 text-sm bg-white shadow-sm"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-gray-500 font-medium border-b bg-gray-50/50">
                            <tr>
                                <th className="text-left py-3 px-3 w-[120px]">분반</th>
                                <th className="text-left py-3 px-3 w-[100px]">이름</th>
                                <th className="text-left py-3 px-3 w-[120px]">학교/학년</th>
                                <th className="text-center py-3 px-3 w-[100px]">출석 상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="py-3 px-3">
                                        {student.class_section ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                {student.class_section}반
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-3 font-medium text-gray-900">
                                        {student.full_name}
                                        <div className="text-[10px] text-gray-400 font-light">{(student.phone || '').slice(-4)}</div>
                                    </td>
                                    <td className="py-3 px-3 text-gray-500 text-xs">
                                        {student.school || '-'} {student.grade && `(${student.grade})`}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <button
                                            onClick={() => toggleAttendance(student.id, student.attendance_status || 'none')}
                                            className="transform active:scale-95 transition-transform"
                                        >
                                            {getStatusBadge(student.attendance_status || 'none')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredStudents.length === 0 && !loading && (
                        <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-lg mt-4 border border-dashed border-gray-200">
                            해당 분반에 학생이 없습니다.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
