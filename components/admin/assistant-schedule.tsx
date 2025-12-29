'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Calendar } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

type WorkShift = {
    id: string
    category: string
    label: string
    time_range: string
    assigned_names: string[]
}

type Assistant = {
    id: string
    full_name: string
    role: string
}

export function AssistantSchedule() {
    const [shifts, setShifts] = useState<WorkShift[]>([])
    const [assistants, setAssistants] = useState<Assistant[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        // Fetch Shifts
        const { data: shiftData } = await supabase
            .from('work_shifts')
            .select('*')
            .order('created_at', { ascending: true })

        if (shiftData) setShifts(shiftData)

        // Fetch Assistants
        const { data: assistantData } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('role', 'assistant')
            .order('full_name')

        if (assistantData) setAssistants(assistantData)
        setLoading(false)
    }

    const handleAssign = async (shiftId: string, name: string) => {
        const shift = shifts.find(s => s.id === shiftId)
        if (!shift) return

        if (shift.assigned_names.includes(name)) return

        const newNames = [...shift.assigned_names, name]

        // Optimistic update
        setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, assigned_names: newNames } : s))

        await supabase.from('work_shifts').update({ assigned_names: newNames }).eq('id', shiftId)
    }

    const handleRemove = async (shiftId: string, name: string) => {
        const shift = shifts.find(s => s.id === shiftId)
        if (!shift) return

        const newNames = shift.assigned_names.filter(n => n !== name)

        // Optimistic update
        setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, assigned_names: newNames } : s))

        await supabase.from('work_shifts').update({ assigned_names: newNames }).eq('id', shiftId)
    }

    // Group by Category for cleaner UI
    const groupedShifts = shifts.reduce((acc, shift) => {
        if (!acc[shift.category]) acc[shift.category] = []
        acc[shift.category].push(shift)
        return acc
    }, {} as Record<string, WorkShift[]>)

    return (
        <Card className="glass border-white/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> 방학기간 조교 근무표
                </CardTitle>
                <CardDescription>
                    각 근무 시간표에 조교를 배정하세요. 이름을 클릭하여 추가/삭제할 수 있습니다.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b-2 border-gray-200">
                            <tr>
                                <th className="p-4 text-left border-r w-[150px]">업무 구분</th>
                                <th className="p-4 text-center border-r w-[100px]">요일</th>
                                <th className="p-4 text-center border-r w-[180px]">시간</th>
                                <th className="p-4 text-left">배정된 조교</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Object.entries(groupedShifts).map(([category, categoryShifts]) => (
                                categoryShifts.map((shift, index) => (
                                    <tr key={shift.id} className="hover:bg-blue-50/30 transition-colors">
                                        {/* Category Cell (Rowspan logic simplified by rendering empty for subsequent) - actually just render every time for simplicity or cleaner look */}
                                        {index === 0 && (
                                            <td className="p-4 font-bold text-gray-800 border-r bg-gray-50/50" rowSpan={categoryShifts.length}>
                                                {category}
                                            </td>
                                        )}
                                        <td className="p-4 text-center border-r font-medium text-gray-600">
                                            {shift.label}
                                        </td>
                                        <td className="p-4 text-center border-r text-gray-500 font-mono">
                                            {shift.time_range}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {shift.assigned_names.map(name => (
                                                    <Badge key={name} variant="secondary" className="pl-2 pr-1 py-1 bg-white border shadow-sm hover:bg-red-50 hover:text-red-600 cursor-pointer group transition-all" onClick={() => handleRemove(shift.id, name)}>
                                                        {name}
                                                        <X className="w-3 h-3 ml-1 text-gray-300 group-hover:text-red-500" />
                                                    </Badge>
                                                ))}

                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full border border-dashed border-gray-300 p-0 text-gray-400 hover:text-blue-600 hover:border-blue-400">
                                                            <Plus className="w-4 h-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px]">
                                                        <DialogHeader>
                                                            <DialogTitle>조교 배정</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                                            {assistants.map(assistant => (
                                                                <Button
                                                                    key={assistant.id}
                                                                    variant="outline"
                                                                    className={`justify-start ${shift.assigned_names.includes(assistant.full_name) ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-blue-500 hover:text-blue-600'}`}
                                                                    onClick={() => {
                                                                        if (!shift.assigned_names.includes(assistant.full_name)) {
                                                                            handleAssign(shift.id, assistant.full_name)
                                                                        }
                                                                    }}
                                                                    disabled={shift.assigned_names.includes(assistant.full_name)}
                                                                >
                                                                    {assistant.full_name}
                                                                </Button>
                                                            ))}
                                                            {assistants.length === 0 && <p className="col-span-2 text-center text-gray-400 py-4">등록된 조교가 없습니다.</p>}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ))}
                        </tbody>
                    </table>
                    {shifts.length === 0 && !loading && (
                        <div className="text-center py-10 text-gray-400">등록된 근무 일정이 없습니다. DB를 확인해주세요.</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
