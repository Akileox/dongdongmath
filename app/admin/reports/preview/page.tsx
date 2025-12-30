'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { ReportTemplate, ReportData } from "@/components/admin/ReportTemplate"
import html2canvas from 'html2canvas'
import { Download, Loader2 } from "lucide-react"

export default function ReportPreviewPage() {
    const reportRef = useRef<HTMLDivElement>(null)
    const [generating, setGenerating] = useState(false)
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    // Mock Data
    const mockData: ReportData = {
        studentName: "김동동",
        period: "2025년 1월 3주차",
        mainScore: 92,
        rank: "상위 4%",
        totalQuestions: 45,
        correctRate: 88,
        weakness: ["삼각함수의 활용", "로그부등식"],
        comment: "전반적으로 매우 훌륭한 성취도를 보이고 있습니다. 특히 지수함수 파트의 이해도가 높습니다. 다만 삼각함수 도형 문제에서 약간의 실수가 있으니 이 부분을 보완하면 만점도 충분히 가능합니다!",
    }

    const [recipientPhone, setRecipientPhone] = useState("01012345678")
    const [sending, setSending] = useState(false)

    const handleSendMMS = async () => {
        if (!previewImage) return alert("이미지를 먼저 생성해주세요.")
        if (!recipientPhone) return alert("전화번호를 입력해주세요.")

        if (!confirm(`${recipientPhone} 번호로 리포트를 발송하시겠습니까?`)) return

        setSending(true)
        try {
            const res = await fetch('/api/admin/reports/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: previewImage,
                    parentPhone: recipientPhone,
                    studentName: mockData.studentName,
                    period: mockData.period
                })
            })
            const data = await res.json()
            if (res.ok) {
                alert("발송 성공 (Mock): " + data.message)
            } else {
                alert("발송 실패: " + data.error)
            }
        } catch (e) {
            console.error(e)
            alert("발송 중 오류 발생")
        } finally {
            setSending(false)
        }
    }

    const handleGenerateImage = async () => {
        if (!reportRef.current) return
        setGenerating(true)

        try {
            // Wait for fonts to load (optional but recommended)
            await document.fonts.ready

            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // Retina quality
                backgroundColor: null, // Transparent or inherited
                useCORS: true, // For external images
                logging: true,
            })

            const imageData = canvas.toDataURL('image/png')
            setPreviewImage(imageData)
        } catch (error) {
            console.error('Image generation failed:', error)
            alert('이미지 생성 실패')
        } finally {
            setGenerating(false)
        }
    }

    const handleDownload = () => {
        if (!previewImage) return
        const link = document.createElement('a')
        link.href = previewImage
        link.download = `report_${mockData.studentName}_${Date.now()}.png`
        link.click()
    }

    return (
        <div className="p-8 space-y-8 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold">리포트 미리보기 & 이미지 생성 테스트</h1>
                    <p className="text-gray-500">html2canvas를 사용한 이미지 변환 기능을 테스트합니다.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <input
                        type="text"
                        value={recipientPhone}
                        onChange={e => setRecipientPhone(e.target.value)}
                        className="border p-2 rounded w-40"
                        placeholder="010-0000-0000"
                    />
                    <Button onClick={handleSendMMS} disabled={sending || !previewImage} className="bg-green-600 hover:bg-green-700">
                        {sending ? '발송 중...' : 'MMS 발송'}
                    </Button>
                    <div className="w-px h-8 bg-gray-300 mx-2"></div>
                    <Button onClick={handleGenerateImage} disabled={generating} size="lg" className="bg-blue-600 hover:bg-blue-700">
                        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {generating ? '생성 중...' : '이미지 변환하기'}
                    </Button>
                    {previewImage && (
                        <Button onClick={handleDownload} variant="outline" size="lg">
                            <Download className="mr-2 h-4 w-4" />
                            다운로드
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {/* Source Component (Visible for verify, or can be hidden) */}
                <div className="space-y-4">
                    <h2 className="font-bold text-gray-700">원본 컴포넌트 (React)</h2>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 overflow-auto flex justify-center">
                        {/* Render the template. Pass ref so html2canvas can find it. */}
                        <ReportTemplate ref={reportRef} data={mockData} />
                    </div>
                </div>

                {/* Generated Image Preview */}
                <div className="space-y-4">
                    <h2 className="font-bold text-gray-700">생성된 이미지 (PNG)</h2>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[500px] flex items-center justify-center relative">
                        {previewImage ? (
                            <img src={previewImage} alt="Generated Report" className="max-w-full shadow-lg" />
                        ) : (
                            <p className="text-gray-400">오른쪽 상단 버튼을 눌러 이미지를 생성하세요.</p>
                        )}
                        {generating && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-sm">
                                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
