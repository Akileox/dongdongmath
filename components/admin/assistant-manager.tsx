'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AssistantManager() {
    const [rawText, setRawText] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: number, fail: number, errors: string[] } | null>(null)

    const handleUpload = async () => {
        if (!rawText.trim()) return

        setLoading(true)
        setResult(null)

        // Format: Name | Phone | Position (optional description)
        const lines = rawText.split('\n').filter(line => line.trim() !== '')

        const users = lines.map(line => {
            let parts = line.split('\t')
            if (parts.length < 2) parts = line.split(',')

            parts = parts.map(p => p.trim())

            const name = parts[0]
            const phone = parts[1]
            const position = parts[2] || '조교'

            if (!name || !phone) return null

            const id = phone.replace(/[^0-9]/g, '')

            return {
                email: `${id}@teamdj.com`,
                name: `${name} T`, // Append T explicitly for assistants
                password: id, // Default password = phone
                phone,
                grade: position, // Store position in grade field or metadata
                role: 'assistant' // Important: Set role to assistant
            }
        }).filter(u => u !== null && u.name !== '이름')

        if (users.length === 0) {
            setLoading(false)
            alert('올바른 데이터 형식이 아닙니다.')
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
                const successes = data.results.filter((r: any) => r.status === 'success').length
                const failures = data.results.filter((r: any) => r.status === 'error')

                setResult({
                    success: successes,
                    fail: failures.length,
                    errors: failures.map((f: any) => `${f.email}: ${f.error}`)
                })
                if (failures.length === 0) setRawText('')
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
                    <CardTitle>조교/선생님 계정 등록</CardTitle>
                    <div className="text-xs text-gray-400 text-right">
                        <p>이름, 전화번호, 직책(선택) 순서입니다.</p>
                        <p className="font-mono mt-1 text-gray-500">자동으로 이름 뒤에 'T'가 붙습니다.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <textarea
                        className="w-full h-40 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:ring-1 focus:ring-black"
                        placeholder={`예시:\n이동재\t010-1234-5678\t메인강사\n김조교\t010-9876-5432\t채점조교`}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                    />

                    <Button
                        onClick={handleUpload}
                        disabled={loading || !rawText.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 shadow-sm"
                    >
                        {loading ? '등록 처리 중...' : '조교 계정 생성'}
                    </Button>

                    {result && (
                        <div className={`p-4 rounded-lg text-sm space-y-2 ${result.fail > 0 ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'}`}>
                            <p className="font-bold">
                                {result.success}명 생성 성공
                                {result.fail > 0 && `, ${result.fail}명 실패`}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
