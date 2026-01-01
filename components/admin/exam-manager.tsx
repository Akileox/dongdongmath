'use client'

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, ChevronRight, Calendar, ExternalLink } from "lucide-react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ExamManager() {
    const [exams, setExams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newExamTitle, setNewExamTitle] = useState('')
    const [newExamGrade, setNewExamGrade] = useState('')
    const [newExamDate, setNewExamDate] = useState('')

    const supabase = createClient()
    const router = useRouter()

    const fetchExams = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('exams')
            .select('*')
            .order('exam_date', { ascending: false })

        if (data) setExams(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchExams()
    }, [])

    const handleCreateExam = async () => {
        if (!newExamTitle || !newExamDate) {
            alert('시험 명과 날짜를 입력해주세요.')
            return
        }

        const { data, error } = await supabase
            .from('exams')
            .insert({
                title: newExamTitle,
                grade: newExamGrade,
                exam_date: newExamDate
            })
            .select()
            .single()

        if (error) {
            alert('생성 실패: ' + error.message)
        } else {
            // Auto-assign students if grade is selected
            if (newExamGrade && newExamGrade !== '기타') {
                const { data: students } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('grade', newExamGrade)

                if (students && students.length > 0) {
                    const toInsert = students.map(s => ({
                        exam_id: data.id,
                        student_id: s.id,
                        score: 0
                    }))

                    const { error: assignError } = await supabase
                        .from('exam_results')
                        .insert(toInsert)

                    if (assignError) {
                        console.error('Auto-assign failed:', assignError)
                        alert('시험은 생성되었으나 학생 자동 배정에 실패했습니다.')
                    } else {
                        alert(`시험이 생성되고 ${students.length}명의 ${newExamGrade} 학생이 자동 배정되었습니다.`)
                    }
                } else {
                    alert(`시험이 생성되었습니다. (해당 학년 학생 없음)`)
                }
            } else {
                alert('시험이 생성되었습니다.')
            }

            setExams([data, ...exams])
            setIsCreateOpen(false)
            setNewExamTitle('')
            setNewExamGrade('')
            setNewExamDate('')
            router.push(`/admin/exams/${data.id}`)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        💯 시험 및 성적 관리
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">등록된 시험 목록입니다. 시험을 선택하여 정답과 성적을 관리하세요.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-200 transition-all hover:scale-105">
                            <Plus size={16} /> 새 시험 등록
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                        <DialogHeader>
                            <DialogTitle>새 시험 등록</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>시험명</Label>
                                <Input
                                    placeholder="예: 2026 1학기 중간고사"
                                    value={newExamTitle}
                                    onChange={e => setNewExamTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>학년</Label>
                                <Select value={newExamGrade} onValueChange={setNewExamGrade}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="학년 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="고1">고1</SelectItem>
                                        <SelectItem value="고2">고2</SelectItem>
                                        <SelectItem value="고3">고3</SelectItem>
                                        <SelectItem value="기타">기타</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>시행일</Label>
                                <Input
                                    type="date"
                                    value={newExamDate}
                                    onChange={e => setNewExamDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateExam}>등록하기</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">로딩 중...</div>
            ) : exams.length === 0 ? (
                <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                    <p>등록된 시험이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {exams.map(exam => (
                        <div
                            key={exam.id}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-4 group relative"
                        >
                            <div className="flex-1 cursor-pointer" onClick={() => router.push(`/admin/exams/${exam.id}`)}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${!exam.grade ? 'bg-gray-100 text-gray-500' :
                                        exam.grade === '고1' ? 'bg-yellow-100 text-yellow-800' :
                                            exam.grade === '고2' ? 'bg-green-100 text-green-800' :
                                                exam.grade === '고3' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-purple-100 text-purple-800'
                                        }`}>
                                        {exam.grade || '미지정'}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar size={12} /> {exam.exam_date}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                    {exam.title}
                                </h3>
                                <div className="text-sm text-gray-500 flex flex-wrap gap-4 items-center">
                                    <span className="flex items-center gap-1">
                                        평균: <strong className="text-gray-900">{exam.average_score ? exam.average_score.toFixed(1) : '-'}</strong>점
                                    </span>
                                    <div className="w-px h-3 bg-gray-300"></div>
                                    <span className="flex items-center gap-1">
                                        최고: <strong className="text-blue-600">{exam.max_score || '-'}</strong>점
                                    </span>
                                    <div className="w-px h-3 bg-gray-300"></div>
                                    <span className="flex items-center gap-1">
                                        최저: <strong className="text-red-600">{exam.min_score || '-'}</strong>점
                                    </span>
                                    {exam.difficulty && (
                                        <>
                                            <div className="w-px h-3 bg-gray-300"></div>
                                            <span className="flex items-center gap-1 text-gray-600">
                                                난이도: {exam.difficulty}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Button
                                    variant="outline"
                                    className="border-gray-200 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/admin/exams/${exam.id}`)
                                    }}
                                >
                                    상세 관리 <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
