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
    const [previewExamResult, setPreviewExamResult] = useState<any>(null)
    const [previewIncorrectAnswers, setPreviewIncorrectAnswers] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        fetchSections()
        fetchRecentLogs()
    }, [])

    useEffect(() => {
        if (date && selectedSection) {
            fetchLogForDateAndSection(date, selectedSection)
            fetchExamForDateAndSection(date, selectedSection)
            fetchSampleStudentData(selectedSection)
        } else {
            setContent('')
            setExistingLogId(null)
            setExamInfo(null)
            setPreviewAssignments([])
            setPreviewStudentName('')
            setPreviewExamResult(null)
            setPreviewIncorrectAnswers([])
        }
    }, [date, selectedSection, sectionGrades])

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
        } else {
            setContent('')
            setExistingLogId(null)
        }
        setLoading(false)
    }

    const fetchSampleStudentData = async (section: string) => {
        // 1. Get a student from this section to use as an example
        const { data: lectures } = await supabase
            .from('lectures')
            .select('id')
            .eq('section', section)

        if (!lectures || lectures.length === 0) return

        const lectureIds = lectures.map(l => l.id)
        const { data: assignments } = await supabase
            .from('lecture_assignments')
            .select('student_id')
            .in('lecture_id', lectureIds)
            .limit(1)

        if (assignments && assignments.length > 0) {
            const studentId = assignments[0].student_id

            // Get Student Name
            const { data: student } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', studentId)
                .single()

            if (student) setPreviewStudentName(student.full_name)

            // 2. Fetch Assignments for this student (Recent 2)
            const { data: subs } = await supabase
                .from('assignment_submissions')
                .select(`
                    status,
                    grade,
                    assignments (
                        title,
                        due_date
                    )
                `)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })
                .limit(2)

            if (subs) {
                const formatted = subs.map((sub: any) => ({
                    title: sub.assignments?.title || 'Unknown Assignment',
                    status: sub.status,
                    grade: sub.grade
                }))
                setPreviewAssignments(formatted)
            }

            // 3. Fetch Exam Result for this student (if exam exists)
            if (date) {
                const grade = sectionGrades.get(section)
                let examQuery = supabase.from('exams').select('id, max_score, section, grade').eq('exam_date', date)
                const { data: exams } = await examQuery

                if (exams && exams.length > 0) {
                    const matched = exams.find(e => e.section === section || (!e.section && e.grade === grade))
                    if (matched) {
                        const { data: myResult } = await supabase
                            .from('exam_results')
                            .select('*')
                            .eq('exam_id', matched.id)
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
                    }
                }
            }
        } else {
            setPreviewStudentName('')
            setPreviewAssignments([])
            setPreviewExamResult(null)
            setPreviewIncorrectAnswers([])
        }
    }

    const fetchExamForDateAndSection = async (d: string, s: string) => {
        // Find exam for this date matching the section OR the section's grade
        const grade = sectionGrades.get(s)

        let query = supabase
            .from('exams')
            .select('*, exam_questions(*)')
            .eq('exam_date', d)

        const { data: exams } = await query

        if (exams && exams.length > 0) {
            // Filter in memory for complex OR condition (Section specific OR Grade wide)
            const matchedExam = exams.find(e =>
                e.section === s || (!e.section && e.grade === grade)
            )
            if (matchedExam && matchedExam.exam_questions) {
                // Sort questions by number
                matchedExam.exam_questions.sort((a: any, b: any) => a.question_number - b.question_number)
            }
            setExamInfo(matchedExam || null)
        } else {
            setExamInfo(null)
        }
    }

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
                        created_by: user.id
                    })
                if (error) throw error
            }
            alert('저장되었습니다.')
            fetchRecentLogs()
            fetchLogForDateAndSection(date, selectedSection)
            fetchExamForDateAndSection(date, selectedSection)
        } catch (e: any) {
            console.error(e)
            alert('저장 실패: ' + e.message)
        } finally {
            setLoading(false)
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
                            학습 코멘트 (여러 줄 작성 가능)
                        </label>
                        <Textarea
                            className="min-h-[300px] resize-none text-base leading-relaxed p-4 bg-white border-gray-300 text-gray-900 focus-visible:ring-blue-500"
                            placeholder="예시:
- 오늘 삼각함수 활용 파트 진도를 나갔습니다.
- 예제 3번 유형을 특히 어려워하여 추가 설명했습니다.
- 과제 이행도가 매우 우수합니다."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

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
        </div>
    )
}
