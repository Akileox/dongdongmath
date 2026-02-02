'use client'

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Save, MessageCircle, Eye, ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { ReportTemplate } from "@/components/reports/report-template"

export function LearningLogManager() {
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [sections, setSections] = useState<string[]>([])
    const [sectionGrades, setSectionGrades] = useState<Map<string, string>>(new Map())
    const [selectedSection, setSelectedSection] = useState<string>('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [sendingKakao, setSendingKakao] = useState(false)
    const [existingLogId, setExistingLogId] = useState<string | null>(null)
    const [recentLogs, setRecentLogs] = useState<any[]>([])
    const [showPreview, setShowPreview] = useState(false)
    const [examInfo, setExamInfo] = useState<any>(null)

    // Preview Data State
    const [previewAssignments, setPreviewAssignments] = useState<any[]>([])
    const [previewStudentName, setPreviewStudentName] = useState<string>('')
    const [previewStudentId, setPreviewStudentId] = useState<string>('') // New State for accessing notes
    const [previewExamResult, setPreviewExamResult] = useState<any>(null)
    const [previewIncorrectAnswers, setPreviewIncorrectAnswers] = useState<any[]>([])

    // Enhanced Features State (Moved up)
    const [availableExams, setAvailableExams] = useState<any[]>([])
    const [selectedExamIds, setSelectedExamIds] = useState<string[]>([])
    const [studentsInSection, setStudentsInSection] = useState<any[]>([])

    // Student Notes State (Search & Filter)
    const [studentNotes, setStudentNotes] = useState<Record<string, string>>({})
    const [noteSearchQuery, setNoteSearchQuery] = useState('')
    const [activeNoteStudents, setActiveNoteStudents] = useState<string[]>([]) // IDs of students with active note inputs

    // Missing Exam Records State
    const [missingExamRecords, setMissingExamRecords] = useState<Record<string, string>>({}) // StudentID -> Reason
    const [missingExamSearchQuery, setMissingExamSearchQuery] = useState('')
    const [activeMissingStudents, setActiveMissingStudents] = useState<string[]>([]) // IDs of students being recorded for missing exam

    // Modal States
    const [isExamModalOpen, setIsExamModalOpen] = useState(false)
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
    const [isMissingModalOpen, setIsMissingModalOpen] = useState(false)
    const [examSearchQuery, setExamSearchQuery] = useState('')

    // DM Modal State
    const [isDMModalOpen, setIsDMModalOpen] = useState(false)
    const [dmTargetStudent, setDmTargetStudent] = useState<any>(null)
    const [dmContent, setDmContent] = useState('')
    const [sendingDM, setSendingDM] = useState(false)

    const supabase = createClient()

    const fetchSampleStudentData = async (section: string) => {
        // 1. Get a student from this section to use as an example
        const { data: lectures } = await supabase
            .from('lectures')
            .select('id')
            .eq('section', section)

        if (!lectures || lectures.length === 0) return

        const lectureIds = lectures.map(l => l.id)

        // Find a student enrolled in these lectures OR profiled in this section
        // Priority to Profile class_section
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('class_section', section)
            .eq('role', 'student')
            .limit(1)

        // Fallback to lecture assignment lookup if profile section not set (legacy support)
        let studentId = profiles?.[0]?.id
        let studentName = profiles?.[0]?.full_name

        if (!studentId) {
            const { data: assignments } = await supabase
                .from('lecture_assignments')
                .select('student_id')
                .in('lecture_id', lectureIds)
                .limit(1)
            if (assignments && assignments[0]) {
                studentId = assignments[0].student_id
                const { data: p } = await supabase.from('profiles').select('full_name').eq('id', studentId).single()
                studentName = p?.full_name
            }
        }

        if (studentId) {
            setPreviewStudentName(studentName || '학생')
            setPreviewStudentId(studentId)

            // 2. Fetch Assignments for this student (All applicable)
            // First, find what lectures the student is assigned to (or if we know the section, we assume section lectures)
            // But to be precise, let's get assignments for the lectures related to the section we started with
            // OR use the lectures we found earlier: `lectureIds` (from line 53)

            if (lectureIds && lectureIds.length > 0) {
                // Get ALL assignments for these lectures
                const { data: allAssignments } = await supabase
                    .from('assignments')
                    .select('id, title, due_date')
                    .in('lecture_id', lectureIds)
                    .order('due_date', { ascending: false })
                    .limit(20) // Fetch reasonable amount

                if (allAssignments) {
                    // Get Submissions for these assignments
                    const assignmentIds = allAssignments.map(a => a.id)
                    const { data: submissions } = await supabase
                        .from('assignment_submissions')
                        .select('assignment_id, status, grade')
                        .eq('student_id', studentId)
                        .in('assignment_id', assignmentIds)

                    // Merge and Status Check
                    const merged = allAssignments.map(a => {
                        const sub = submissions?.find(s => s.assignment_id === a.id)
                        let status = 'pending'
                        if (sub) {
                            status = sub.status
                        } else {
                            if (new Date(a.due_date) < new Date()) status = 'overdue'
                        }

                        return {
                            title: a.title,
                            status: status,
                            grade: sub?.grade,
                            due_date: a.due_date,
                            isOverdue: status === 'overdue', // Fix for ReportTemplate
                            dueDate: a.due_date // Fix to match ReportTemplate expectation (it looks for dueDate or uses due_date?) ReportTemplate uses sub.dueDate in line 286
                        }
                    })

                    // Sort: Overdue/Pending First, then by date
                    merged.sort((a, b) => {
                        const scoreA = (a.status === 'overdue' || a.status === 'pending') ? 1 : 0
                        const scoreB = (b.status === 'overdue' || b.status === 'pending') ? 1 : 0
                        if (scoreA !== scoreB) return scoreB - scoreA // Higher score first
                        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
                    })

                    setPreviewAssignments(merged.slice(0, 5)) // Show top 5 relevant
                }
            } else {
                setPreviewAssignments([])
            }

            // 3. Fetch Exam Result for this student (if exam exists)
            // Use selectedExamIds if available
            if (selectedExamIds.length > 0) {
                const mainExamId = selectedExamIds[0]
                const { data: myResult } = await supabase
                    .from('exam_results')
                    .select('*')
                    .eq('exam_id', mainExamId)
                    .eq('student_id', studentId)
                    .single()

                if (myResult) {
                    setPreviewExamResult(myResult)
                    // Get Incorrect Answers
                    const { data: incorrects } = await supabase
                        .from('exam_incorrect_answers')
                        .select('question_number, description')
                        .eq('result_id', myResult.id)

                    if (incorrects) setPreviewIncorrectAnswers(incorrects)
                } else {
                    setPreviewExamResult(null)
                    setPreviewIncorrectAnswers([])
                }
            } else {
                setPreviewExamResult(null)
                setPreviewIncorrectAnswers([])
            }
        } else {
            setPreviewStudentName('')
            setPreviewStudentId('')
            setPreviewAssignments([])
            setPreviewExamResult(null)
            setPreviewIncorrectAnswers([])
        }
    }

    const fetchSections = async () => {
        const { data } = await supabase.from('lectures').select('section, grade')
        if (data) {
            const uniqueSections = Array.from(new Set(data.map(l => l.section))).sort()
            const gradeMap = new Map<string, string>()
            data.forEach(l => {
                if (l.section) gradeMap.set(l.section, l.grade)
            })
            setSections(uniqueSections)
            setSectionGrades(gradeMap)
            if (uniqueSections.length > 0) setSelectedSection(uniqueSections[0])
        }
    }

    const fetchRecentLogs = async () => {
        const { data } = await supabase
            .from('learning_logs')
            .select('*')
            .order('log_date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(10)

        if (data) setRecentLogs(data)
    }



    const mapStudentsToNotes = (students: any[], notes: any) => {
        const initialNotes: Record<string, string> = {}
        students.forEach(s => {
            initialNotes[s.id] = notes?.[s.id] || ''
        })
        setStudentNotes(initialNotes)
    }

    const fetchLogForDateAndSection = async (d: string, s: string) => {
        setLoading(true)
        const { data } = await supabase
            .from('learning_logs')
            .select('*')
            .eq('log_date', d)
            .eq('section_name', s)
            .single()

        if (data) {
            setContent(data.content)
            setExistingLogId(data.id)
            setSelectedExamIds(data.related_exam_ids || [])
            setStudentNotes(data.student_notes || {})
        } else {
            setContent('')
            setExistingLogId(null)
            setSelectedExamIds([])
            // Keep student notes empty, but we need to re-initialize based on current students
            // Wait for fetchStudentsInSection to run
        }
        setLoading(false)
    }

    const fetchAvailableExams = async () => {
        // Fetch exams from last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data } = await supabase
            .from('exams')
            .select('*')
            .gte('exam_date', thirtyDaysAgo.toISOString().split('T')[0])
            .order('exam_date', { ascending: false })

        if (data) setAvailableExams(data)
    }

    const fetchStudentsInSection = async (section: string) => {
        // 1. Try fetching by Profile Class Section
        let { data: students } = await supabase
            .from('profiles')
            .select('id, full_name, class_section')
            .eq('class_section', section)
            .eq('role', 'student')
            .order('full_name')

        // 2. Fallback: If no students found by profile, try linking via Lectures -> Assignments
        if (!students || students.length === 0) {
            const { data: lectures } = await supabase
                .from('lectures')
                .select('id')
                .eq('section', section)

            if (lectures && lectures.length > 0) {
                const lectureIds = lectures.map(l => l.id)

                // Get unique students who have assignments in these lectures
                const { data: assignments } = await supabase
                    .from('lecture_assignments')
                    .select('student_id')
                    .in('lecture_id', lectureIds)

                if (assignments && assignments.length > 0) {
                    const studentIds = Array.from(new Set(assignments.map((a: any) => a.student_id)))

                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, full_name, class_section')
                        .in('id', studentIds)
                        .order('full_name')

                    if (profiles) students = profiles
                }
            }
        }

        if (students) {
            setStudentsInSection(students)
            // If we are creating new, init notes
            if (!existingLogId) {
                const notes: Record<string, string> = {}
                students.forEach(s => notes[s.id] = '')
                setStudentNotes(notes)
            }
        } else {
            setStudentsInSection([])
        }
    }

    useEffect(() => {
        fetchAvailableExams()
    }, [])

    useEffect(() => {
        if (selectedSection) {
            fetchStudentsInSection(selectedSection)
        }
    }, [selectedSection, existingLogId])

    useEffect(() => {
        fetchSections()
        fetchRecentLogs()
        fetchAvailableExams()
    }, [])

    useEffect(() => {
        if (date && selectedSection) {
            fetchLogForDateAndSection(date, selectedSection)
            fetchSampleStudentData(selectedSection)
        } else {
            setContent('')
            setExistingLogId(null)
            setExamInfo(null)
            setPreviewAssignments([])
            setPreviewStudentName('')
            setPreviewStudentId('')
            setPreviewExamResult(null)
            setPreviewIncorrectAnswers([])
            setStudentNotes({})
        }
    }, [date, selectedSection, sectionGrades])

    // Update ExamInfo when selected exams change (for preview)
    useEffect(() => {
        const updatePreviewExam = async () => {
            if (selectedExamIds.length > 0) {
                const mainExamId = selectedExamIds[0]
                const { data: exam } = await supabase
                    .from('exams')
                    .select('*, exam_questions(*)')
                    .eq('id', mainExamId)
                    .single()

                if (exam) {
                    if (exam.exam_questions) {
                        exam.exam_questions.sort((a: any, b: any) => a.question_number - b.question_number)
                    }
                    setExamInfo(exam)
                }
            } else {
                setExamInfo(null)
            }
        }
        updatePreviewExam()
    }, [selectedExamIds])

    const handleSave = async () => {
        if (!selectedSection || !date || !content.trim()) {
            alert('모든 필드를 입력해 주세요.')
            return
        }

        setLoading(true)
        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) throw new Error('Not authenticated')

            if (existingLogId) {
                const { error } = await supabase
                    .from('learning_logs')
                    .update({
                        content: content,
                        related_exam_ids: selectedExamIds,
                        student_notes: studentNotes,
                        missing_exam_records: missingExamRecords,
                        created_by: user.id
                    })
                    .eq('id', existingLogId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('learning_logs')
                    .insert({
                        section_name: selectedSection,
                        log_date: date,
                        content: content,
                        related_exam_ids: selectedExamIds,
                        student_notes: studentNotes,
                        missing_exam_records: missingExamRecords,
                        created_by: user.id
                    })
                if (error) throw error
            }
            alert('저장되었습니다.')
            fetchRecentLogs()
            fetchLogForDateAndSection(date, selectedSection)
        } catch (e: any) {
            console.error(e)
            alert('저장 실패: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDM = (student: any) => {
        setDmTargetStudent(student)
        setIsDMModalOpen(true)
    }

    const handleSendDM = async () => {
        if (!dmContent.trim() || !dmTargetStudent) return
        setSendingDM(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: user?.id,
                    receiver_id: dmTargetStudent.id,
                    content: dmContent
                })

            if (error) throw error

            alert('쪽지가 전송되었습니다.')
            setDmContent('')
            setIsDMModalOpen(false)
        } catch (e: any) {
            alert('전송 실패: ' + e.message)
        } finally {
            setSendingDM(false)
        }
    }

    const handleSendImage = async () => {
        if (!confirm('현재 화면을 이미지로 변환하여 해당 분반 학부모님들께 전송하시겠습니까?')) return

        setSendingKakao(true)
        // Simulate Image Generation and Sending delay
        await new Promise(resolve => setTimeout(resolve, 2500))

        alert('성공적으로 전송되었습니다!\n(실제 기능: 이미지 생성 -> S3 업로드 -> 알림톡 발송)')
        setSendingKakao(false)
        setShowPreview(false)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input Area */}
            <Card className="md:col-span-2 border shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>학습 내용 작성</CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowPreview(true)}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            미리보기 & 발송
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Date & Section Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">날짜 선택</label>
                            <input
                                type="date"
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">분반 선택</label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="bg-white border-gray-300 text-gray-900 font-medium">
                                    <SelectValue placeholder="분반을 선택하세요" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">
                            학습 코멘트 (전체 공통)
                        </label>
                        <Textarea
                            className="min-h-[150px] resize-none text-base leading-relaxed p-4 bg-white border-gray-300 text-gray-900 focus-visible:ring-blue-500"
                            placeholder="전체 학생에게 공통으로 나가는 멘트를 작성하세요."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {/* Exam Selection: Selected List & Add Button */}
                    <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100/50">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 p-1 rounded">📎</span>
                                관련된 테스트 <span className="text-xs font-normal text-gray-500">(선택한 테스트의 통계가 리포트에 포함됩니다)</span>
                            </h4>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsExamModalOpen(true)}
                                className="bg-white hover:bg-blue-50 text-blue-600 border-blue-200 h-8 text-xs font-bold"
                            >
                                + 테스트 추가/검색
                            </Button>
                        </div>

                        {/* Selected Exams Chips */}
                        {selectedExamIds.length === 0 ? (
                            <div className="text-sm text-gray-400 text-center py-4 bg-white rounded border border-dashed text-xs">
                                선택된 테스트가 없습니다. 버튼을 눌러 추가해주세요.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {availableExams.filter(e => selectedExamIds.includes(e.id)).map(exam => (
                                    <div key={exam.id} className="flex items-center gap-2 bg-blue-100/50 text-blue-900 px-3 py-1.5 rounded-full border border-blue-100 text-xs font-medium shadow-sm">
                                        <span>[{exam.exam_date}] {exam.title} ({exam.max_score}점)</span>
                                        <button
                                            onClick={() => setSelectedExamIds(prev => prev.filter(id => id !== exam.id))}
                                            className="text-blue-400 hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Exam Selection Modal */}
                    <Dialog open={isExamModalOpen} onOpenChange={setIsExamModalOpen}>
                        <DialogContent className="max-w-2xl bg-white max-h-[80vh] flex flex-col">
                            <DialogTitle className="text-lg font-bold text-gray-900 mb-2">
                                리포트에 포함할 테스트 선택
                            </DialogTitle>

                            <div className="flex-1 overflow-hidden flex flex-col gap-4">
                                {/* Search Bar */}
                                <div className="relative shrink-0">
                                    <input
                                        type="text"
                                        placeholder="테스트 제목 검색..."
                                        className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={examSearchQuery}
                                        onChange={(e) => setExamSearchQuery(e.target.value)}
                                    />
                                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>

                                {/* Exam List */}
                                <div className="flex-1 overflow-y-auto border rounded-md p-2 bg-gray-50 space-y-1">
                                    {availableExams
                                        .filter(exam => exam.title.toLowerCase().includes(examSearchQuery.toLowerCase()))
                                        .map(exam => {
                                            const isSelected = selectedExamIds.includes(exam.id)
                                            return (
                                                <div
                                                    key={exam.id}
                                                    onClick={() => {
                                                        if (isSelected) setSelectedExamIds(prev => prev.filter(id => id !== exam.id))
                                                        else setSelectedExamIds(prev => [...prev, exam.id])
                                                    }}
                                                    className={`
                                                        flex items-center justify-between p-3 rounded cursor-pointer transition-colors
                                                        ${isSelected ? 'bg-blue-100 border border-blue-200' : 'bg-white border border-gray-100 hover:bg-gray-100'}
                                                    `}
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                                                            {exam.title}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {exam.exam_date} · {exam.max_score}점 만점
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    {availableExams.filter(exam => exam.title.toLowerCase().includes(examSearchQuery.toLowerCase())).length === 0 && (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            검색 결과가 없습니다.
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 shrink-0 pt-2 border-t">
                                    <Button variant="outline" onClick={() => setIsExamModalOpen(false)}>
                                        선택 완료
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Student Specific Notes (Button -> Modal) */}
                    <div className="bg-yellow-50/30 p-4 rounded-lg border border-yellow-100/50">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-sm text-yellow-900 flex items-center gap-2">
                                <span className="bg-yellow-100 text-yellow-600 p-1 rounded">💬</span>
                                학생별 특이사항 작성 <span className="text-xs font-normal text-gray-500">(선택한 학생만 개별 코멘트가 전송됩니다)</span>
                            </h4>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsNoteModalOpen(true)}
                                className="bg-white hover:bg-yellow-50 text-yellow-700 border-yellow-200 h-8 text-xs font-bold"
                            >
                                + 학생 추가
                            </Button>
                        </div>

                        {/* Active Note Fields */}
                        <div className="space-y-3">
                            {activeNoteStudents.length === 0 ? (
                                <div className="text-sm text-gray-400 italic text-center py-4 bg-white rounded border border-dashed border-yellow-100 text-xs">
                                    특이사항을 작성할 학생을 추가해주세요.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {activeNoteStudents.map(studentId => {
                                        const student = studentsInSection.find(s => s.id === studentId)
                                        if (!student) return null
                                        return (
                                            <div key={student.id} className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-yellow-200 shadow-sm relative group">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                                        {student.full_name}
                                                        <span className="text-xs text-gray-400 font-normal bg-gray-100 px-1.5 py-0.5 rounded">
                                                            {student.class_section || '미지정'}
                                                        </span>
                                                        {/* Quick DM Button */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleOpenDM(student)
                                                            }}
                                                            className="ml-1 text-gray-400 hover:text-blue-500"
                                                            title="쪽지 보내기"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                            </svg>
                                                        </button>
                                                    </label>
                                                    <button
                                                        onClick={() => {
                                                            setActiveNoteStudents(prev => prev.filter(id => id !== student.id))
                                                            const newNotes = { ...studentNotes }
                                                            delete newNotes[student.id]
                                                            setStudentNotes(newNotes)
                                                        }}
                                                        className="text-gray-300 hover:text-red-500 p-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-yellow-500 bg-gray-50/50"
                                                    placeholder={`${student.full_name} 학생에게만 보일 멘트 입력`}
                                                    value={studentNotes[student.id] || ''}
                                                    onChange={(e) => setStudentNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Missing Exam Registration (Button -> Modal) */}
                    <div className="bg-red-50/30 p-4 rounded-lg border border-red-100/50">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-sm text-red-900 flex items-center gap-2">
                                <span className="bg-red-100 text-red-600 p-1 rounded">🚨</span>
                                테스트 미응시 / 과제 미제출 <span className="text-xs font-normal text-gray-500">(대상 학생과 사유를 기록합니다)</span>
                            </h4>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsMissingModalOpen(true)}
                                className="bg-white hover:bg-red-50 text-red-600 border-red-200 h-8 text-xs font-bold"
                            >
                                + 학생 추가
                            </Button>
                        </div>

                        {/* Active Missing Fields */}
                        <div className="space-y-3">
                            {activeMissingStudents.length === 0 ? (
                                <div className="text-sm text-gray-400 italic text-center py-4 bg-white rounded border border-dashed border-red-100 text-xs">
                                    미응시/미제출 학생이 없습니다.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {activeMissingStudents.map(studentId => {
                                        const student = studentsInSection.find(s => s.id === studentId)
                                        if (!student) return null
                                        return (
                                            <div key={student.id} className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-red-200 shadow-sm relative group">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                        {student.full_name}
                                                    </label>
                                                    <button
                                                        onClick={() => {
                                                            setActiveMissingStudents(prev => prev.filter(id => id !== student.id))
                                                            const newRecords = { ...missingExamRecords }
                                                            delete newRecords[student.id]
                                                            setMissingExamRecords(newRecords)
                                                        }}
                                                        className="text-gray-300 hover:text-red-500 p-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-red-500 bg-gray-50/50 placeholder:text-red-200"
                                                    placeholder="사유 입력 (예: 결석, 병결, 무단불참)"
                                                    value={missingExamRecords[student.id] || ''}
                                                    onChange={(e) => setMissingExamRecords(prev => ({ ...prev, [student.id]: e.target.value }))}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modals for Student Selection */}
                    {[
                        {
                            isOpen: isNoteModalOpen,
                            setOpen: setIsNoteModalOpen,
                            title: '특이사항 작성 학생 선택',
                            query: noteSearchQuery,
                            setQuery: setNoteSearchQuery,
                            activeList: activeNoteStudents,
                            setActive: setActiveNoteStudents,
                            color: 'yellow'
                        },
                        {
                            isOpen: isMissingModalOpen,
                            setOpen: setIsMissingModalOpen,
                            title: '미응시/미제출 학생 선택',
                            query: missingExamSearchQuery,
                            setQuery: setMissingExamSearchQuery,
                            activeList: activeMissingStudents,
                            setActive: setActiveMissingStudents,
                            color: 'red'
                        }
                    ].map(modal => (
                        <Dialog key={modal.title} open={modal.isOpen} onOpenChange={modal.setOpen}>
                            <DialogContent className="max-w-md bg-white max-h-[80vh] flex flex-col">
                                <DialogTitle className="text-lg font-bold text-gray-900 mb-2">
                                    {modal.title}
                                </DialogTitle>
                                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                                    <div className="relative shrink-0">
                                        <input
                                            type="text"
                                            placeholder="이름 검색..."
                                            className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-${modal.color}-500 outline-none`}
                                            value={modal.query}
                                            onChange={(e) => modal.setQuery(e.target.value)}
                                        />
                                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 overflow-y-auto border rounded-md p-2 bg-gray-50 space-y-1">
                                        {studentsInSection
                                            .filter(s => s.full_name.includes(modal.query))
                                            .map(student => {
                                                const isSelected = modal.activeList.includes(student.id)
                                                return (
                                                    <div
                                                        key={student.id}
                                                        onClick={() => {
                                                            if (isSelected) modal.setActive(prev => prev.filter(id => id !== student.id))
                                                            else modal.setActive(prev => [...prev, student.id])
                                                        }}
                                                        className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${isSelected
                                                            ? `bg-${modal.color}-50 border border-${modal.color}-200`
                                                            : 'bg-white border border-gray-100 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{student.full_name}</span>
                                                            <span className="text-xs text-gray-500">{student.class_section || '분반 미지정'}</span>
                                                        </div>
                                                        {isSelected && (
                                                            <div className={`h-5 w-5 rounded-full bg-${modal.color}-500 text-white flex items-center justify-center`}>
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })
                                        }
                                        {studentsInSection.length === 0 && <div className="text-center py-4 text-gray-400 text-xs">학생이 없습니다.</div>}
                                    </div>
                                    <div className="flex justify-end pt-2 border-t">
                                        <Button variant="outline" onClick={() => modal.setOpen(false)}>완료</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto font-bold text-white shadow-sm">
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? '저장 중...' : existingLogId ? '수정 내용 저장' : '등록하기'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Logs List */}
            <Card className="border shadow-sm bg-gray-50">
                <CardHeader>
                    <CardTitle className="text-base text-gray-600">최근 등록된 리포트</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {recentLogs.length === 0 && <div className="text-sm text-gray-400 text-center py-4">등록된 내용이 없습니다.</div>}
                        {recentLogs.map(log => (
                            <div
                                key={log.id}
                                className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                                onClick={() => {
                                    setDate(log.log_date)
                                    setSelectedSection(log.section_name)
                                }}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-900 text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{log.section_name}</span>
                                    <span className="text-xs text-gray-500 font-medium">{new Date(log.log_date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed group-hover:text-gray-900 transition-colors">{log.content}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto bg-gray-100 p-0 border-none shadow-2xl">
                    <div className="sticky top-0 z-50 bg-white border-b p-3 flex justify-between items-center">
                        <DialogTitle className="font-bold text-gray-800 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                            학부모 전송 미리보기 (가로 모드)
                            {previewStudentName && <span className="text-xs font-normal text-gray-500 ml-2">(*예시 데이터: {previewStudentName} 학생)</span>}
                        </DialogTitle>
                        <Button
                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xs"
                            onClick={handleSendImage}
                            disabled={sendingKakao}
                        >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {sendingKakao ? '전송 중...' : '이미지 전송'}
                        </Button>
                    </div>

                    {/* Preview Content Wrapper */}
                    <div className="p-4">
                        <div className="bg-white rounded-xl shadow overflow-hidden">
                            <ReportTemplate
                                date={date}
                                title={`${selectedSection} 리포트`}
                                hasExam={!!examInfo}
                                score={previewExamResult ? previewExamResult.score : (examInfo?.average_score || 0)}
                                mean={examInfo?.average_score || 0}
                                sd={15}
                                maxScore={examInfo?.max_score || 100}
                                incorrectQuestions={previewIncorrectAnswers}
                                learningLogs={[{ id: 'preview', content: content || '작성된 내용이 없습니다.', log_date: date }]}
                                dailyStudentNote={previewStudentId ? studentNotes[previewStudentId] : ''} // Pass the note
                                relatedAssignments={previewAssignments.length > 0 ? previewAssignments : [
                                    { title: '등록된 과제가 없습니다', status: 'pending', grade: null }
                                ]}
                                isPreview={true}
                                allQuestions={
                                    examInfo?.exam_questions?.map((q: any) => {
                                        const isIncorrect = previewIncorrectAnswers.some(inc => inc.question_number === q.question_number)
                                        return {
                                            question_number: q.question_number,
                                            description: q.description || '',
                                            is_correct: !isIncorrect,
                                            answer: q.correct_answer
                                        }
                                    }) || []
                                }
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* DM Send Modal */}
            <Dialog open={isDMModalOpen} onOpenChange={setIsDMModalOpen}>
                <DialogContent className="max-w-md bg-white">
                    <DialogTitle>쪽지 보내기</DialogTitle>
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg border">
                            <span className="text-sm font-bold text-gray-700">받는 사람:</span>
                            <span className="ml-2 text-blue-600 font-bold">{dmTargetStudent?.full_name}</span>
                            <span className="text-xs text-gray-500 ml-1">({dmTargetStudent?.class_section})</span>
                        </div>
                        <Textarea
                            placeholder="내용을 입력하세요..."
                            value={dmContent}
                            onChange={(e) => setDmContent(e.target.value)}
                            className="min-h-[150px] bg-white text-gray-900 border-gray-300 focus:border-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsDMModalOpen(false)}>취소</Button>
                            <Button onClick={handleSendDM} disabled={sendingDM || !dmContent.trim()}>
                                {sendingDM ? '전송 중...' : '전송하기'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
