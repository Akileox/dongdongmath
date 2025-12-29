'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Trash2 } from "lucide-react"
import { Student } from "./types"

interface RegistrationListProps {
    students: Student[]
    searchTerm: string
    setSearchTerm: (term: string) => void
    fetchStudents: () => void
    handleEditCell: (id: string, field: keyof Student, value: string) => void
    handleDelete: (id: string) => void
}

export function RegistrationList({
    students,
    searchTerm,
    setSearchTerm,
    fetchStudents,
    handleEditCell,
    handleDelete
}: RegistrationListProps) {
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="이름 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                />
                <Button variant="outline" onClick={fetchStudents}>검색</Button>
            </div>

            <div className="border rounded-md max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 text-left">이름</th>
                            <th className="p-3 text-left">전화번호</th>
                            <th className="p-3 text-left">학교</th>
                            <th className="p-3 text-left">학년</th>
                            <th className="p-3 text-left min-w-[70px]">분반</th>
                            <th className="p-3 text-left min-w-[150px]">현재 학습</th>
                            <th className="p-3 text-center">권한</th>
                            <th className="p-3 text-center w-[50px]">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {students.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50/50">
                                <td className="p-2 pl-3">
                                    <input
                                        className="bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-full"
                                        value={student.full_name || ''}
                                        placeholder="(이름 없음)"
                                        onChange={(e) => handleEditCell(student.id, 'full_name', e.target.value)}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-full text-gray-500"
                                        value={student.phone}
                                        readOnly
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className={`bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-full ${student.role === 'assistant' ? 'text-gray-300 pointer-events-none' : ''}`}
                                        value={student.school || ''}
                                        placeholder={student.role === 'assistant' ? '입력불가' : '-'}
                                        readOnly={student.role === 'assistant'}
                                        onChange={(e) => handleEditCell(student.id, 'school', e.target.value)}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className={`bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-full ${student.role === 'assistant' ? 'text-gray-300 pointer-events-none' : ''}`}
                                        value={student.grade || ''}
                                        placeholder={student.role === 'assistant' ? '입력불가' : '-'}
                                        readOnly={student.role === 'assistant'}
                                        onChange={(e) => handleEditCell(student.id, 'grade', e.target.value)}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-full font-bold text-blue-600"
                                        value={student.class_section || ''}
                                        placeholder="미배정"
                                        onChange={(e) => handleEditCell(student.id, 'class_section', e.target.value)}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-full text-gray-700"
                                        value={student.current_study || ''}
                                        placeholder="학습 내용 입력"
                                        onChange={(e) => handleEditCell(student.id, 'current_study', e.target.value)}
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    <Badge
                                        className={`cursor-pointer text-white border-0 ${student.role === 'admin' ? 'bg-blue-600 hover:bg-blue-700' :
                                                student.role === 'assistant' ? 'bg-green-600 hover:bg-green-700' :
                                                    'bg-gray-600 hover:bg-gray-700'
                                            }`}
                                        onClick={() => {
                                            if (student.role === 'admin') return;
                                            const newRole = student.role === 'assistant' ? 'student' : 'assistant'
                                            if (confirm(`"${student.full_name}" 님의 권한을 ${newRole === 'assistant' ? '조교' : '학생'}로 변경하시겠습니까?`)) {
                                                handleEditCell(student.id, 'role', newRole)
                                            }
                                        }}
                                    >
                                        {student.role === 'admin' ? '선생님' : student.role === 'assistant' ? '조교' : '학생'}
                                    </Badge>
                                </td>
                                <td className="p-2 text-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(student.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-xs text-gray-400 text-right">* 표를 클릭하여 이름, 학교, 학년, <strong>분반</strong>을 수정할 수 있습니다. 권한 뱃지를 클릭하여 역할을 변경하세요.</div>
        </div>
    )
}
