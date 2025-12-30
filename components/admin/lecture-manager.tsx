'use client'

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useRouter } from "next/navigation"
import { ImagePlus } from "lucide-react"

export function LectureManager() {
    const [title, setTitle] = useState('')
    const [section, setSection] = useState('')
    const [grade, setGrade] = useState('')
    const [youtubeLink, setYoutubeLink] = useState('')
    const [learningGuide, setLearningGuide] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [playlistUrl, setPlaylistUrl] = useState('')
    const [syncLoading, setSyncLoading] = useState(false)
    const [syncMessage, setSyncMessage] = useState('')

    // List State
    const [lectures, setLectures] = useState<any[]>([])
    // Removed Edit/Expand states as we navigate to detail page now

    const supabase = createClient()
    const router = useRouter()

    const fetchLectures = async () => {
        const { data } = await supabase.from('lectures').select('*').order('created_at', { ascending: true })
        if (data) setLectures(data)
    }

    useEffect(() => {
        fetchLectures()
    }, [])

    const handleSyncPlaylist = async () => {
        if (!playlistUrl || !section || !grade) {
            setSyncMessage('학년, 섹션명, 재생목록 URL을 모두 입력해주세요.')
            return
        }

        const finalSection = `[${grade}] ${section}`

        setSyncLoading(true)
        setSyncMessage('유튜브 데이터를 분석 중입니다...')

        try {
            const res = await fetch('/api/admin/lectures/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playlistUrl, section: finalSection })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Sync failed')

            setSyncMessage(`성공! ${data.count}개의 영상을 동기화했습니다.`)
            setPlaylistUrl('')
            fetchLectures() // Refresh list
            router.refresh()
        } catch (e: any) {
            setSyncMessage('오류 발생: ' + e.message)
        } finally {
            setSyncLoading(false)
        }
    }

    const handleAddLecture = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!grade) {
            setMessage('학년을 선택해주세요.')
            return
        }

        setLoading(true)
        setMessage('')

        const finalSection = `[${grade}] ${section}`

        const { error } = await supabase.from('lectures').insert({
            title,
            section: finalSection,
            youtube_link: youtubeLink,
            learning_guide: learningGuide,
        })

        if (error) {
            setMessage('Error: ' + error.message)
        } else {
            setMessage('새 강의가 추가되었습니다!')
            setTitle('')
            setYoutubeLink('')
            setLearningGuide('')
            fetchLectures()
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <Card className="glass border-white/10">
            <CardHeader>
                {/* Updated CardTitle to reflect combined header */}
                {/* <CardTitle>새 강의 추가</CardTitle> */}
            </CardHeader>
            <CardContent>
                {/* Header Section */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="bg-blue-100 p-2 rounded-lg">📺</span>
                        강좌 등록 및 관리
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">유튜브 재생목록을 동기화하거나 개별 강의를 수동으로 등록하세요.</p>
                </div>

                {/* Playlist Sync Section */}
                <div className="mb-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">🔄 유튜브 재생목록 동기화</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <Select value={grade} onValueChange={setGrade}>
                            <SelectTrigger className="bg-white md:col-span-1">
                                <SelectValue placeholder="학년 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="고1">고1</SelectItem>
                                <SelectItem value="고2">고2</SelectItem>
                                <SelectItem value="고3">고3</SelectItem>
                                <SelectItem value="기타">기타</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="섹션명 (예: 2026 겨울 스파르타 공통수학1)"
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="bg-white md:col-span-3"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="유튜브 재생목록 URL (https://www.youtube.com/playlist?list=...)"
                            value={playlistUrl}
                            onChange={(e) => setPlaylistUrl(e.target.value)}
                            className="bg-white flex-1"
                        />
                        <Button
                            onClick={handleSyncPlaylist}
                            disabled={syncLoading || !playlistUrl || !section || !grade}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold whitespace-nowrap px-6"
                        >
                            {syncLoading ? '동기화 중...' : '동기화 시작'}
                        </Button>
                    </div>
                    {syncMessage && <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-100/50 p-2 rounded inline-block">{syncMessage}</p>}
                </div>

                {/* Form Section */}
                {/* Removed id="lecture-form-anchor" as scrolling to form for edit is no longer needed */}
                <form onSubmit={handleAddLecture} className="space-y-4 mb-12">
                    <h3 className="font-bold text-gray-900 mb-2">⚡ 개별 강의 추가</h3>
                    {/* Removed conditional rendering for '강의 수정' / '개별 강의 추가' and '수정 취소' button */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <Input
                                placeholder="강의 제목 (예: 1강 - 지수함수의 뜻)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="bg-white border-gray-200"
                            />
                            <div className="grid grid-cols-3 gap-2">
                                <Select value={grade} onValueChange={setGrade}>
                                    <SelectTrigger className="bg-white col-span-1">
                                        <SelectValue placeholder="학년" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="고1">고1</SelectItem>
                                        <SelectItem value="고2">고2</SelectItem>
                                        <SelectItem value="고3">고3</SelectItem>
                                        <SelectItem value="기타">기타</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="섹션 (예: 2026 ...)"
                                    value={section}
                                    onChange={(e) => setSection(e.target.value)}
                                    required
                                    className="bg-white border-gray-200 col-span-2"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Input
                                placeholder="YouTube 링크 (URL)"
                                value={youtubeLink}
                                onChange={(e) => setYoutubeLink(e.target.value)}
                                required
                                className="bg-white border-gray-200"
                            />
                            <Textarea
                                placeholder="학습 가이드 (선택 사항)"
                                value={learningGuide}
                                onChange={(e) => setLearningGuide(e.target.value)}
                                className="min-h-[40px] bg-white border-gray-200"
                            />
                            <Button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800 text-white font-bold transition-colors">
                                {loading ? '추가 중...' : '강의 추가하기'}
                            </Button>
                        </div>
                    </div>
                    {message && <p className="text-sm text-gray-400 mt-2">{message}</p>}
                </form>

                <div className="my-8 border-t border-gray-200"></div>

                {/* Course List Section (Admin View) */}
                <div>
                    <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                        📚 등록된 강좌 관리
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">클릭하여 상세 관리 페이지로 이동</span>
                    </h3>

                    {lectures.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">등록된 강의가 없습니다.</div>
                    ) : (
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="mb-6 h-auto p-1 bg-gray-100 rounded-lg inline-flex">
                                <TabsTrigger value="all" className="px-4 py-2">전체</TabsTrigger>
                                {['고1', '고2', '고3', '기타'].map(g => (
                                    <TabsTrigger key={g} value={g} className="px-4 py-2">{g}</TabsTrigger>
                                ))}
                            </TabsList>

                            {/* Helper to render sections */}
                            {['all', '고1', '고2', '고3', '기타'].map(tabValue => {
                                // Filter unique sections for this tab
                                const filteredLectures = lectures.filter(l => tabValue === 'all' || l.section.includes(`[${tabValue}]`));
                                const sections = Array.from(new Set(filteredLectures.map(l => l.section))).sort();

                                return (
                                    <TabsContent key={tabValue} value={tabValue} className="mt-0">
                                        {sections.length === 0 && <div className="text-center text-gray-400 py-10">해당 학년의 강좌가 없습니다.</div>}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {sections.map(secName => {
                                                const firstLecture = filteredLectures.find(l => l.section === secName);
                                                if (!firstLecture) return null;

                                                // Strip tag for display
                                                const displayName = secName.replace(/\[.*?\]\s*/, '');
                                                const count = filteredLectures.filter(l => l.section === secName).length;

                                                return (
                                                    <div
                                                        key={secName}
                                                        className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col"
                                                        onClick={() => router.push(`/admin/lectures/${firstLecture.id}`)}
                                                    >
                                                        <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                                            {firstLecture.youtube_link ? (
                                                                <img
                                                                    src={`https://img.youtube.com/vi/${firstLecture.youtube_link.split('v=')[1]?.split('&')[0]}/mqdefault.jpg`}
                                                                    alt={displayName}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">📺</div>
                                                            )}
                                                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-bold">
                                                                {count}강
                                                            </div>
                                                            <Button
                                                                variant="secondary"
                                                                className="absolute top-2 left-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white p-0 border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    alert("썸네일 등록 기능은 준비 중입니다. (추후 업데이트)");
                                                                }}
                                                                title="강좌 썸네일/커버 이미지 등록"
                                                            >
                                                                <ImagePlus size={14} />
                                                            </Button>
                                                        </div>
                                                        <div className="p-4">
                                                            <div className="flex gap-2 mb-2">
                                                                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{tabValue === 'all' ? (secName.match(/^\[(.*?)\]/) || [])[1] || '기타' : tabValue}</span>
                                                            </div>
                                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                                                                {displayName}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 line-clamp-2">
                                                                눌러서 강의 목록 관리 및 가이드 수정
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </TabsContent>
                                )
                            })}
                        </Tabs>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
