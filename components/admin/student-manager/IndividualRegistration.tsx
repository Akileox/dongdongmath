'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface IndividualRegistrationProps {
    newStudent: { name: string, phone: string, parent_phone: string, grade: string, school: string, role: string }
    setNewStudent: (student: any) => void
    handleIndividualAdd: () => void
    loading: boolean
}

export function IndividualRegistration({
    newStudent,
    setNewStudent,
    handleIndividualAdd,
    loading
}: IndividualRegistrationProps) {
    return (
        <div className="grid gap-4 max-w-md border p-6 rounded-xl bg-white shadow-sm">
            <h3 className="font-bold text-lg mb-2">신규 구성원 등록</h3>
            <label className="text-sm font-medium">권한 (Role)</label>
            <Input value="학생" disabled className="bg-gray-100 text-gray-500" />
            <div className="space-y-2">
                <label className="text-sm font-medium">이름</label>
                <Input
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="홍길동"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">학생 휴대폰 (ID)</label>
                    <Input
                        value={newStudent.phone}
                        onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                        placeholder="010-0000-0000"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">학부모 휴대폰</label>
                    <Input
                        value={newStudent.parent_phone}
                        onChange={(e) => setNewStudent({ ...newStudent, parent_phone: e.target.value })}
                        placeholder="010-0000-0000"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">학교</label>
                    <Input
                        value={newStudent.school}
                        onChange={(e) => setNewStudent({ ...newStudent, school: e.target.value })}
                        placeholder={newStudent.role === 'assistant' ? '입력불가' : 'OO고'}
                        disabled={newStudent.role === 'assistant'}
                        className={newStudent.role === 'assistant' ? 'bg-gray-100 text-gray-400' : ''}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">학년</label>
                    <Input
                        value={newStudent.grade}
                        onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                        placeholder={newStudent.role === 'assistant' ? '입력불가' : '고1'}
                        disabled={newStudent.role === 'assistant'}
                        className={newStudent.role === 'assistant' ? 'bg-gray-100 text-gray-400' : ''}
                    />
                </div>
            </div>
            <Button onClick={handleIndividualAdd} disabled={loading} variant="blue" className="w-full font-bold mt-2">
                {loading ? '등록 중...' : '등록하기'}
            </Button>
        </div>
    )
}
