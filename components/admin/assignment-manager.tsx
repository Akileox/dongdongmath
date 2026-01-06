'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function AssignmentManager() {
    const [assignments, setAssignments] = useState<any[]>([])
    const [lectures, setLectures] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [dueDate, setDueDate] = useState<Date>()
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
    const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set()) // Track purely for visual selection

    // Detail View State
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
    const [submissions, setSubmissions] = useState<any[]>([])
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    // Filters for Selection - (Unused but kept for structure)
    // const [filterSection, setFilterSection] = useState<string>("all") 
    const [lectureAssignments, setLectureAssignments] = useState<Map<string, Set<string>>>(new Map()) // lecture_id -> Set of student_ids

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Assignments
            const { data: assignmentsData } = await supabase
                .from('assignments')
                .select('*, assignment_submissions(count)')
                .order('created_at', { ascending: false })

            // 2. Fetch Students
            const { data: studentsData } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'student')
                .order('full_name')

            // 3. Fetch Lectures (for Class-based selection)
            const { data: lecturesData } = await supabase
                .from('lectures')
                .select('id, title, section, grade')

            // 4. Fetch Lecture Assignments (to know who is in which class)
            const { data: lectureAssignmentsData } = await supabase
                .from('lecture_assignments')
                .select('student_id, lecture_id')

            setAssignments(assignmentsData || [])
            setStudents(studentsData || [])
            setLectures(lecturesData || [])

            // Build Lecture Assignment Map
            const newMap = new Map<string, Set<string>>()
            lectureAssignmentsData?.forEach(la => {
                if (!newMap.has(la.lecture_id)) newMap.set(la.lecture_id, new Set())
                newMap.get(la.lecture_id)?.add(la.student_id)
            })
            setLectureAssignments(newMap)

        } catch (error) {
            console.error(error)
            alert("데이터 로딩 실패")
        } finally {
            setLoading(false)
        }
    }

    // Sanitize selectedStudents to ensure no "ghost" (non-student) IDs remain
    useEffect(() => {
        if (loading || students.length === 0) return

        const validStudentIds = new Set(students.map(s => s.id))
        const sanitizedSelection = new Set<string>()
        let hasInvalid = false

        selectedStudents.forEach(id => {
            if (validStudentIds.has(id)) {
                sanitizedSelection.add(id)
            } else {
                hasInvalid = true
            }
        })

        if (hasInvalid) {
            setSelectedStudents(sanitizedSelection)
        }
    }, [selectedStudents, students, loading])

    const handleCreateAssignment = async () => {
        if (!title || selectedStudents.size === 0) {
            alert("제목과 대상을 입력해주세요")
            return
        }

        setIsSubmitting(true)
        try {
            // 1. Create Assignment
            const { data: newAssignment, error: assignError } = await supabase
                .from('assignments')
                .insert({
                    title,
                    description,
                    due_date: dueDate?.toISOString()
                })
                .select()
                .single()

            if (assignError) throw assignError

            // 2. Create Submissions (Trigger will auto-create Todos)
            const submissions = Array.from(selectedStudents).map(studentId => ({
                assignment_id: newAssignment.id,
                student_id: studentId,
                status: 'pending'
            }))

            const { error: subError } = await supabase
                .from('assignment_submissions')
                .insert(submissions)

            if (subError) throw subError

            alert(`과제가 생성되었습니다. ${submissions.length}명에게 할 일이 등록되었습니다.`)
            setIsCreateOpen(false)
            resetForm()
            fetchData()

        } catch (error: any) {
            alert("생성 실패: " + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setTitle("")
        setDescription("")
        setDueDate(undefined)
        setSelectedStudents(new Set())
        setSelectedSections(new Set())
    }

    // Detail View Handlers
    const handleOpenDetail = async (assignment: any) => {
        setSelectedAssignment(assignment)
        setIsDetailOpen(true)

        try {
            const { data } = await supabase
                .from('assignment_submissions')
                .select(`
                    *,
                    student:profiles(full_name, school, grade)
                `)
                .eq('assignment_id', assignment.id)

            // Client side sort by student name
            const sorted = (data || []).sort((a: any, b: any) => (a.student?.full_name || '').localeCompare(b.student?.full_name || ''))
            setSubmissions(sorted)
        } catch (e) {
            console.error(e)
            alert("제출 현황 로딩 실패")
        }
    }

    const updateSubmission = async (id: string, field: string, value: any) => {
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
        try {
            const { error } = await supabase.from('assignment_submissions').update({ [field]: value }).eq('id', id)
            if (error) throw error
        } catch (e) {
            console.error(e)
            alert("업데이트 실패")
        }
    }

    const handleDeleteAssignment = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) return
        try {
            const { error } = await supabase.from('assignments').delete().eq('id', id)
            if (error) throw error
            alert("삭제되었습니다.")
            setIsDetailOpen(false)
            fetchData()
        } catch (e) {
            alert("삭제 실패")
        }
    }

    // Helper to select students by Section
    const handleSelectBySection = (sectionName: string, sectionStudentIds: Set<string>) => {
        const newSelectedSections = new Set(selectedSections)
        const isCurrentlySelected = newSelectedSections.has(sectionName)

        if (isCurrentlySelected) {
            newSelectedSections.delete(sectionName)
        } else {
            newSelectedSections.add(sectionName)
        }
        setSelectedSections(newSelectedSections)

        const nextSelectedStudents = new Set(selectedStudents)

        if (!isCurrentlySelected) {
            // Turning ON: Simple Union
            sectionStudentIds.forEach(sid => nextSelectedStudents.add(sid))
        } else {
            // Turning OFF: Check overlaps
            sectionStudentIds.forEach(sid => {
                // Only remove if not in other selected sections
                let isInOtherSelected = false
                for (const group of sectionsData) {
                    if (group.section !== sectionName && newSelectedSections.has(group.section)) {
                        if (group.studentIds.has(sid)) {
                            isInOtherSelected = true
                            break
                        }
                    }
                }

                if (!isInOtherSelected) {
                    nextSelectedStudents.delete(sid)
                }
            })
        }

        setSelectedStudents(nextSelectedStudents)
    }

    const toggleStudent = (id: string) => {
        const newSet = new Set(selectedStudents)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedStudents(newSet)
    }

    // Prepare Sections Data
    const sectionsData = (() => {
        const map = new Map<string, { section: string, grade: string, count: number, studentIds: Set<string> }>()
        const validStudentIds = new Set(students.map(s => s.id))

        lectures.forEach(l => {
            if (!map.has(l.section)) {
                map.set(l.section, { section: l.section, grade: l.grade, count: 0, studentIds: new Set() })
            }
            const data = map.get(l.section)!

            const studentIds = lectureAssignments.get(l.id)
            studentIds?.forEach(sid => {
                if (validStudentIds.has(sid) && !data.studentIds.has(sid)) {
                    data.studentIds.add(sid)
                    data.count++
                }
            })
        })
        return Array.from(map.values())
    })()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> 새 과제 만들기
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assignments.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleOpenDetail(assignment)}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span className="line-clamp-1 group-hover:text-blue-600 transition-colors">{assignment.title}</span>
                                <Badge variant={assignment.due_date && new Date(assignment.due_date) < new Date() ? "destructive" : "secondary"}
                                    className={cn("ml-2 whitespace-nowrap",
                                        !(assignment.due_date && new Date(assignment.due_date) < new Date()) && "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                                    )}
                                >
                                    {assignment.due_date ? format(new Date(assignment.due_date), "M/d") : "기한없음"}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                {assignment.description || "설명 없음"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {assignment.assignment_submissions[0]?.count || 0}명 배정
                                </div>
                                <div className="text-xs">
                                    {format(new Date(assignment.created_at), "yyyy-MM-dd")} 등록
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Assignment Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-black sm:rounded-lg">
                    <DialogHeader>
                        <DialogTitle>새 과제 생성</DialogTitle>
                        <DialogDescription>
                            과제를 생성하면 선택된 학생들의 할 일(Todo) 목록에 자동으로 추가됩니다.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* 1. Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">과제명</label>
                                <Input
                                    placeholder="예: 미적분 3단원 필수 예제 풀이"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-900">설명 (선택)</label>
                                <Textarea
                                    placeholder="상세 내용을 입력하세요"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="bg-white text-black resize-none"
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-gray-900">마감일 (선택)</label>
                                </div>
                                <Input
                                    type="date"
                                    value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : undefined
                                        setDueDate(date)
                                    }}
                                    className="bg-white text-black"
                                />
                            </div>
                        </div>

                        {/* 2. Target Selection */}
                        <div className="space-y-4 border-t border-gray-200 pt-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-900">대상 학생 선택 ({selectedStudents.size}명)</label>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 hover:bg-gray-100" onClick={() => { setSelectedStudents(new Set()); setSelectedSections(new Set()); }}>전체 해제</Button>
                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setSelectedStudents(new Set(students.map(s => s.id)))}>전체 선택</Button>
                                </div>
                            </div>

                            <Tabs defaultValue="class" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="class">분반별 선택</TabsTrigger>
                                    <TabsTrigger value="individual">개별 선택</TabsTrigger>
                                </TabsList>

                                <TabsContent value="class" className="space-y-4 mt-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {sectionsData.map(group => {
                                            if (group.count === 0) return null
                                            const isSelected = selectedSections.has(group.section)

                                            return (
                                                <Button
                                                    key={group.section}
                                                    variant="ghost"
                                                    className={cn(
                                                        "justify-between h-auto py-4 px-4 text-left whitespace-normal h-full transition-all border shadow-sm",
                                                        isSelected
                                                            ? "bg-black text-white border-black hover:bg-gray-800 hover:text-white"
                                                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-black hover:border-gray-300"
                                                    )}
                                                    onClick={() => handleSelectBySection(group.section, group.studentIds)}
                                                >
                                                    <div className="flex flex-col items-start gap-2">
                                                        <span className="font-bold text-base">{group.section}</span>
                                                        <span className={cn("text-xs px-2 py-0.5 rounded border",
                                                            isSelected ? "bg-white/20 text-white border-transparent" : "bg-gray-100 text-gray-500 border-gray-200"
                                                        )}>{group.grade}</span>
                                                    </div>
                                                    <Badge variant="secondary" className={cn("ml-2",
                                                        isSelected ? "bg-white/20 text-white hover:bg-white/30" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    )}>{group.count}명</Badge>
                                                </Button>
                                            )
                                        })}
                                    </div>
                                    {sectionsData.length === 0 && <p className="text-sm text-gray-500 text-center py-4">등록된 강좌가 없습니다.</p>}
                                </TabsContent>

                                <TabsContent value="individual" className="mt-4">
                                    <div className="mb-2">
                                        <Input
                                            placeholder="이름 검색..."
                                            className="h-8 text-sm"
                                            onChange={(e) => {
                                                // Simple client-side filter could be added here if list is long
                                            }}
                                        />
                                    </div>
                                    <div className="h-[200px] overflow-y-auto border rounded-md p-2 space-y-1">
                                        {students.map(student => (
                                            <div key={student.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer transition-colors" onClick={() => toggleStudent(student.id)}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.has(student.id)}
                                                    className="rounded border-gray-300 text-black focus:ring-black h-4 w-4"
                                                    readOnly={true} // ReadOnly because div onClick handles it, preventing double toggle
                                                />
                                                <span className="text-sm font-medium text-gray-900">{student.full_name}</span>
                                                <span className="text-xs text-gray-500">{student.school} {student.grade}</span>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>취소</Button>
                        <Button onClick={handleCreateAssignment} disabled={isSubmitting || selectedStudents.size === 0}>
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            {selectedStudents.size}명에게 과제 배포
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail / Grading Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-black sm:rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center pr-8">
                            <span>{selectedAssignment?.title}</span>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAssignment(selectedAssignment.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </DialogTitle>
                        <DialogDescription>
                            학생별 과제 이행도(%)와 피드백을 기록하세요.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-[150px_120px_1fr] gap-4 font-bold text-sm bg-gray-50 p-2 rounded items-center text-center text-gray-900 border-b border-gray-200">
                            <div>학생</div>
                            <div>이행도(%)</div>
                            <div>피드백</div>
                        </div>
                        {submissions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">제출 내역이 없습니다.</div>
                        ) : (
                            submissions.map((sub: any) => (
                                <div key={sub.id} className="grid grid-cols-[150px_120px_1fr] gap-4 items-center border-b border-gray-100 pb-2 last:border-0 hover:bg-gray-50/50 p-2 rounded transition-colors text-sm text-gray-900">
                                    <div>
                                        <div className="font-medium text-black">{sub.student?.full_name}</div>
                                        <div className="text-xs text-gray-500">{sub.student?.school} {sub.student?.grade}</div>
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="h-8 text-center bg-white text-black border-gray-200"
                                            placeholder="%"
                                            defaultValue={sub.grade || ''}
                                            onBlur={(e) => {
                                                const val = e.target.value
                                                if (val !== sub.grade) {
                                                    updateSubmission(sub.id, 'grade', val)
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            className="h-8 bg-white text-black border-gray-200"
                                            defaultValue={sub.feedback || ''}
                                            onBlur={(e) => {
                                                if (e.target.value !== sub.feedback) {
                                                    updateSubmission(sub.id, 'feedback', e.target.value)
                                                }
                                            }}
                                            placeholder="피드백 입력..."
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
