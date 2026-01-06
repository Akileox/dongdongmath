'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { StudentSelector } from "@/components/admin/student-selector"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, Info, Users, Save, Trash2, Plus, ListChecks } from "lucide-react"
import { GradingDialog } from "@/components/admin/grading-dialog"

export default function ExamDetailPage() {
    const params = useParams()
    const id = params.id as string
    const supabase = createClient()
    const router = useRouter()

    const [exam, setExam] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('info')

    // --- State & Fetch ---
    const [questions, setQuestions] = useState<any[]>([])
    const [assignedStudents, setAssignedStudents] = useState<any[]>([])
    const [isAssignOpen, setIsAssignOpen] = useState(false)
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([])
    const [gradingTarget, setGradingTarget] = useState<any>(null)

    // Meta Edit State
    const [isEditingMeta, setIsEditingMeta] = useState(false)
    const [editTitle, setEditTitle] = useState('')
    const [editDate, setEditDate] = useState('')
    const [editGrade, setEditGrade] = useState('')
    const [editMaxScore, setEditMaxScore] = useState(100)

    useEffect(() => {
        fetchData()
    }, [id])

    useEffect(() => {
        if (exam) {
            setEditTitle(exam.title)
            setEditGrade(exam.grade || '')
            setEditDate(exam.exam_date)
            setEditMaxScore(exam.max_score || 100)
        }
    }, [exam])

    const fetchData = async () => {
        setLoading(true)
        // Fetch Exam
        const { data: examData } = await supabase.from('exams').select('*').eq('id', id).single()
        if (examData) setExam(examData)

        // Fetch Questions
        const { data: qData } = await supabase.from('exam_questions').select('*').eq('exam_id', id).order('question_number', { ascending: true })
        if (qData) setQuestions(qData)

        // Fetch Assigned Students (Results + Profile)
        const { data: rData } = await supabase
            .from('exam_results')
            .select(`
                *,
                student:profiles!student_id(id, full_name, grade, school)
            `)
            .eq('exam_id', id)
            .order('created_at', { ascending: true })

        if (rData) {
            setAssignedStudents(rData.map((r: any) => ({
                ...r.student,
                // Handle deletion case gracefully if needed
                id: r.student_id,
                result_id: r.id,
                score: r.score,
                feedback: r.feedback,
                details: r.details
            })).filter((s: any) => s.full_name))
        }
        setLoading(false)
    }

    // --- Handlers ---
    const handleSaveMeta = async () => {
        await supabase.from('exams').update({
            title: editTitle,
            grade: editGrade,
            exam_date: editDate,
            max_score: editMaxScore
        }).eq('id', id)
        setExam({ ...exam, title: editTitle, grade: editGrade, exam_date: editDate, max_score: editMaxScore })
        setIsEditingMeta(false)
    }

    const handleAddQuestion = async () => {
        const nextNum = questions.length > 0 ? Math.max(...questions.map(q => q.question_number)) + 1 : 1
        const { data, error } = await supabase.from('exam_questions').insert({
            exam_id: id,
            question_number: nextNum,
            correct_answer: '',
            score_value: 1
        }).select().single()

        if (error) {
            console.error(error)
            alert('문항 추가 실패: ' + error.message)
            return
        }

        if (data) setQuestions([...questions, data])
    }

    const handleBulkScoreOne = async () => {
        if (!confirm('모든 문항의 배점을 1점으로 변경하시겠습니까?')) return

        const { error } = await supabase
            .from('exam_questions')
            .update({ score_value: 1 })
            .eq('exam_id', id)

        if (error) {
            alert('변경 실패: ' + error.message)
        } else {
            setQuestions(questions.map(q => ({ ...q, score_value: 1 })))
        }
    }

    const handleUpdateQuestion = async (qId: string, field: string, value: any) => {
        // Optimistic update
        setQuestions(questions.map(q => q.id === qId ? { ...q, [field]: value } : q))
        await supabase.from('exam_questions').update({ [field]: value }).eq('id', qId)
    }

    const handleDeleteQuestion = async (qId: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        await supabase.from('exam_questions').delete().eq('id', qId)
        setQuestions(questions.filter(q => q.id !== qId))
    }

    const handleScoreChange = async (studentId: string, scoreStr: string) => {
        const score = parseInt(scoreStr) || 0
        setAssignedStudents(prev => prev.map(s => s.id === studentId ? { ...s, score } : s))
        const resultId = assignedStudents.find(s => s.id === studentId)?.result_id
        if (resultId) {
            await supabase.from('exam_results').update({ score }).eq('id', resultId)
        }
    }

    const handleAssignStudents = async (selectedIds: string[]) => {
        // Filter out already assigned
        const currentIds = assignedStudents.map(s => s.id)
        const newIds = selectedIds.filter(id => !currentIds.includes(id))

        if (newIds.length === 0) {
            setIsAssignOpen(false)
            return
        }

        const toInsert = newIds.map(sid => ({
            exam_id: id,
            student_id: sid,
            score: 0
        }))

        const { error } = await supabase.from('exam_results').insert(toInsert)
        if (error) {
            alert('학생 배정 실패: ' + error.message)
        } else {
            alert(`${newIds.length}명의 학생이 배정되었습니다.`)
            fetchData()
        }
        setIsAssignOpen(false)
    }

    const handleRemoveStudent = async (resultId: string) => {
        if (!confirm('이 학생의 성적 데이터를 삭제하고 배정을 취소하시겠습니까?')) return
        await supabase.from('exam_results').delete().eq('id', resultId)
        setAssignedStudents(assignedStudents.filter(s => s.result_id !== resultId))
    }

    if (loading) return <div className="p-8 text-center">로딩 중...</div>
    if (!exam) return <div className="p-8 text-center">시험 정보를 찾을 수 없습니다.</div>

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 pb-32">
            <div className="flex justify-between items-center mb-4">
                <Button variant="ghost" className="pl-0" onClick={() => router.push('/admin')}>
                    <ChevronLeft size={16} /> 목록으로 돌아가기
                </Button>
                <Button variant="destructive" size="sm" onClick={async () => {
                    if (confirm('이 시험을 정말 삭제하시겠습니까? \n\n연결된 모든 문제와 학생 성적 데이터가 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.')) {
                        const { error } = await supabase.from('exams').delete().eq('id', id)
                        if (error) {
                            alert('삭제 실패: ' + error.message)
                        } else {
                            alert('삭제되었습니다.')
                            router.push('/admin')
                        }
                    }
                }}>
                    <Trash2 size={16} className="mr-2" /> 시험 삭제
                </Button>
            </div>

            {/* Header Section */}
            <div className="mb-8 flex justify-between items-start">
                {isEditingMeta ? (
                    <div className="space-y-4 w-full max-w-lg bg-gray-50 p-4 rounded-xl border border-blue-200">
                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="font-bold text-lg" placeholder="시험명" />
                        <Select value={editGrade} onValueChange={setEditGrade}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="학년 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="고1">고1</SelectItem>
                                <SelectItem value="고2">고2</SelectItem>
                                <SelectItem value="고3">고3</SelectItem>
                                <SelectItem value="기타">기타</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                        <Input
                            type="number"
                            placeholder="배점 (예: 100)"
                            value={editMaxScore}
                            onChange={e => setEditMaxScore(Number(e.target.value))}
                        />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveMeta}>저장</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditingMeta(false)}>취소</Button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            {exam.title}
                            <span className="text-base font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md ml-2">{exam.grade || '미지정'}</span>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-black ml-1" onClick={() => setIsEditingMeta(true)}>
                                <Info size={16} />
                            </Button>
                        </h1>
                        <p className="text-gray-500">{exam.exam_date} 시행</p>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="info" className="gap-2"><Info size={16} /> 기본 정보 및 정답 관리</TabsTrigger>
                    <TabsTrigger value="scores" className="gap-2"><Users size={16} /> 학생별 점수 관리</TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center bg-gray-50/50">
                            <div>
                                <CardTitle>문항 및 정답 관리</CardTitle>
                                <CardDescription>각 문제의 정답과 배점을 입력해주세요.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleBulkScoreOne} className="gap-1 bg-white border-blue-200 text-blue-600 hover:bg-blue-50">
                                    <ListChecks size={16} /> 1점으로 일괄 변경
                                </Button>
                                <Button size="sm" onClick={handleAddQuestion} className="gap-1">
                                    <Plus size={16} /> 문항 추가
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">번호</TableHead>
                                        <TableHead>정답</TableHead>
                                        <TableHead>배점</TableHead>
                                        <TableHead>유형/설명</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {questions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-400">등록된 문항이 없습니다.</TableCell>
                                        </TableRow>
                                    ) : questions.map((q) => (
                                        <TableRow key={q.id}>
                                            <TableCell className="font-bold text-center bg-gray-50/50">
                                                {q.question_number}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    className="w-20"
                                                    value={q.correct_answer || ''}
                                                    onChange={(e) => handleUpdateQuestion(q.id, 'correct_answer', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="w-20"
                                                    value={q.score_value || 0}
                                                    onChange={(e) => handleUpdateQuestion(q.id, 'score_value', parseInt(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    className="w-full"
                                                    placeholder="내용 없음"
                                                    value={q.description || ''}
                                                    onChange={(e) => handleUpdateQuestion(q.id, 'description', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => handleDeleteQuestion(q.id)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="scores">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>학생별 점수 입력</CardTitle>
                                <CardDescription>시험에 응시한 학생들의 점수를 입력합니다.</CardDescription>
                            </div>
                            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="gap-2">
                                        <Plus size={16} /> 학생 배정 / 추가
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl bg-white h-[80vh] flex flex-col p-4 md:p-6">
                                    <DialogHeader>
                                        <DialogTitle>시험 응시 학생 배정</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex-1 overflow-hidden mt-4 min-h-0">
                                        <StudentSelector
                                            onSelectionChange={setTempSelectedIds}
                                            initialSelectedIds={assignedStudents.map(s => s.id)}
                                        />
                                    </div>
                                    <DialogFooter className="mt-4">
                                        <Button onClick={() => handleAssignStudents(tempSelectedIds)} className="w-full md:w-auto">
                                            {tempSelectedIds.length}명 배정하기
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {assignedStudents.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 border border-dashed rounded-xl">
                                    <p>아직 배정된 학생이 없습니다.</p>
                                    <p className="text-sm">우측 상단의 '학생 배정 / 추가' 버튼을 눌러 학생을 추가해주세요.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {assignedStudents.map(student => (
                                        <div key={student.result_id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors group">
                                            <div>
                                                <p className="font-bold text-gray-900">{student.full_name || '이름 없음'}</p>
                                                <p className="text-xs text-gray-500">{student.school} / {student.grade}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-blue-600">{student.score}</span>
                                                    <span className="text-sm text-gray-400">점</span>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => setGradingTarget(student)}>
                                                    채점
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveStudent(student.result_id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Grading Dialog */}
            {gradingTarget && (
                <GradingDialog
                    open={!!gradingTarget}
                    onOpenChange={(open) => !open && setGradingTarget(null)}
                    examTitle={exam.title}
                    studentName={gradingTarget.full_name}
                    resultId={gradingTarget.result_id}
                    questions={questions}
                    initialDetails={gradingTarget.details}
                    onSave={() => {
                        fetchData()
                        setGradingTarget(null)
                    }}
                />
            )}
        </div>
    )
}
