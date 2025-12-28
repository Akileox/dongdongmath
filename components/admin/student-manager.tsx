'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StudentManager() {
    const [rawText, setRawText] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: number, fail: number, errors: string[] } | null>(null)

    const handleUpload = async () => {
        if (!rawText.trim()) return

        setLoading(true)
        setResult(null)

        // Parse Excel Copy-Paste (Tab separated) or CSV (Comma separated)
        // Format: Name | Phone | Grade
        const lines = rawText.split('\n').filter(line => line.trim() !== '')

        const users = lines.map(line => {
            // Split by tab (Excel) or comma (CSV)
            let parts = line.split('\t')
            if (parts.length < 2) parts = line.split(',') // Fallback to CSV

            // Clean up
            parts = parts.map(p => p.trim())

            // Expected: Name, Phone, Grade
            const name = parts[0]
            const phone = parts[1]
            const grade = parts[2] || ''

            if (!name || !phone) return null

            // Rule: ID is Phone Number (digits only)
            const id = phone.replace(/[^0-9]/g, '')

            // Rule: Default API password will be used (123456*)

            return {
                email: `${id}@teamdj.com`, // Auto-generate email
                name,
                phone,
                grade
            }
        }).filter(u => u !== null && u.name !== '이름') // Filter out header if pasted (checking valid name)

        if (users.length === 0) {
            setLoading(false)
            alert('올바른 데이터 형식이 아닙니다. (이름, 전화번호, 학년 순서로 입력해주세요)')
            return
        }

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users }),
            })

            const data = await res.json()

            if (res.ok) {
                // Count success/fail from results
                const successes = data.results.filter((r: any) => r.status === 'success').length
                const failures = data.results.filter((r: any) => r.status === 'error')

                setResult({
                    success: successes,
                    fail: failures.length,
                    errors: failures.map((f: any) => `${f.email}: ${f.error}`)
                })
                if (failures.length === 0) setRawText('') // Clear input on success
            } else {
                alert(`Error: ${data.error}`)
            }
        } catch (error) {
            alert('Upload failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="glass border-white/10">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>학생 일괄 등록</CardTitle>
                    <div className="text-xs text-gray-400 text-right">
                        <p>엑셀 헤더를 제외한 <strong>데이터만</strong> 복사해서 붙여넣으세요.</p>
                        <p className="font-mono mt-1 text-gray-500">초기 비밀번호: 123456* (로그인 후 변경 필요)</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <textarea
                        className="w-full h-40 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:ring-1 focus:ring-black"
                        placeholder={`예시:\n김철수\t010-1234-5678\t3학년\n이영희\t010-9876-5432\t1학년`}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                    />

                    <Button
                        onClick={handleUpload}
                        disabled={loading || !rawText.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 shadow-sm"
                    >
                        {loading ? '등록 처리 중...' : '학생 계정 일괄 생성'}
                    </Button>

                    {result && (
                        <div className={`p-4 rounded-lg text-sm space-y-2 ${result.fail > 0 ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'}`}>
                            <p className="font-bold">
                                {result.success}명 생성 성공
                                {result.fail > 0 && `, ${result.fail}명 실패`}
                            </p>
                            {result.errors.length > 0 && (
                                <ul className="list-disc pl-4 text-xs space-y-1 opacity-80 max-h-32 overflow-y-auto">
                                    {result.errors.map((e, i) => (
                                        <li key={i}>{e}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
