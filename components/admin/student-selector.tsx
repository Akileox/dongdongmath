'use client'

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Search, Filter, Plus, Minus, Check } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Student {
    id: string
    full_name: string
    grade?: string
    class_section?: string
    school?: string
}

interface StudentSelectorProps {
    onSelectionChange: (selectedIds: string[]) => void
    initialSelectedIds?: string[]
}

export function StudentSelector({ onSelectionChange, initialSelectedIds = [] }: StudentSelectorProps) {
    const [students, setStudents] = useState<Student[]>([])
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchStudents() {
            // Fetch from profiles table. Ensure role is student if applicable, but schema image shows 'role' in profiles.
            // Assuming we filter by role = 'student' or similar if needed.
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, grade, class_section, school')
                // .eq('role', 'student') // Uncomment if role column exists and is used
                .order('full_name')

            if (data) {
                setStudents(data)
                setFilteredStudents(data)
            }
            setLoading(false)
        }
        fetchStudents()
    }, [supabase])

    useEffect(() => {
        let res = students
        if (search) {
            res = res.filter(s =>
                s.full_name?.includes(search) ||
                s.class_section?.includes(search) ||
                s.school?.includes(search)
            )
        }
        setFilteredStudents(res)
    }, [search, students])

    const toggleSelect = (id: string) => {
        const newSelection = selectedIds.includes(id)
            ? selectedIds.filter(sid => sid !== id)
            : [...selectedIds, id]

        setSelectedIds(newSelection)
        onSelectionChange(newSelection)
    }

    const selectAllFiltered = () => {
        const newIds = [...selectedIds]
        filteredStudents.forEach(s => {
            if (!newIds.includes(s.id)) newIds.push(s.id)
        })
        setSelectedIds(newIds)
        onSelectionChange(newIds)
    }

    return (
        <div className="flex gap-4 h-[500px]">
            {/* Left: Search & List */}
            <div className="flex-1 flex flex-col border rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="p-4 border-b space-y-3 bg-gray-50/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="학생 이름, 학교, 반 검색"
                            className="pl-9 bg-white"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>검색 결과: {filteredStudents.length}명</span>
                        <Button variant="ghost" size="sm" onClick={selectAllFiltered} className="h-6 text-xs px-2 hover:bg-blue-50 hover:text-blue-600">
                            + 전체 선택
                        </Button>
                    </div>
                </div>
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-1">
                        {filteredStudents.map(student => {
                            const isSelected = selectedIds.includes(student.id)
                            return (
                                <div
                                    key={student.id}
                                    onClick={() => toggleSelect(student.id)}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent hover:border-gray-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            {student.full_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{student.full_name}</p>
                                            <p className="text-xs text-gray-400">
                                                {student.school} {student.grade && `• ${student.grade}`} {student.class_section && `• ${student.class_section}`}
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected ? <Check size={16} className="text-blue-600" /> : <Plus size={16} className="text-gray-300" />}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* Right: Selected List */}
            <div className="w-1/3 flex flex-col border rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                    <span className="font-bold text-sm">선택된 학생</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {selectedIds.length}명
                    </Badge>
                </div>
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-1">
                        {students.filter(s => selectedIds.includes(s.id)).map(student => (
                            <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                                <span className="text-sm font-medium text-gray-700">{student.full_name}</span>
                                <button onClick={() => toggleSelect(student.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <Minus size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
