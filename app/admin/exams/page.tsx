'use client'

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, ChevronRight, Calculator, Calendar } from "lucide-react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ExamListPage() {
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
            setExams([data, ...exams])
            setIsCreateOpen(false)
            setNewExamTitle('')
            setNewExamGrade('')
            setNewExamDate('')
            router.push(`/admin/exams/${data.id}`)
        }
    }

    return (
        <div className="max-w-[1200px] mx-auto p-8 pb-32">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">💯 시험 및 성적 관리</h1>
                    <p className="text-gray-500 mt-2">등록된 시험을 관리하고 학생들의 성적을 입력합니다.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-black hover:bg-gray-800 text-white gap-2">
                            <Plus size={16} /> 새 시험 등록
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                <Card className="border-dashed border-2 bg-gray-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Calculator size={48} className="mb-4 opacity-20" />
                        <p>등록된 시험이 없습니다.</p>
                        <Button variant="link" onClick={() => setIsCreateOpen(true)}>새 시험 등록하기</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead className="w-[100px]">학년</TableHead>
                                <TableHead>시험명</TableHead>
                                <TableHead>시행일</TableHead>
                                <TableHead className="text-right">평균 점수</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {exams.map(exam => (
                                <TableRow key={exam.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/admin/exams/${exam.id}`)}>
                                    <TableCell>
                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{exam.grade || '미지정'}</span>
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900">{exam.title}</TableCell>
                                    <TableCell className="text-gray-500 text-sm flex items-center gap-1">
                                        <Calendar size={14} /> {exam.exam_date}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {exam.average_score ? `${exam.average_score}점` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-gray-400">
                                        <ChevronRight size={16} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
