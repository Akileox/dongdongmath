'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StudentManager() {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setLoading(true)
        setMessage('Processing...')

        const text = await file.text()
        // Simple CSV parser: email,name,phone
        const lines = text.split('\n').filter(line => line.trim() !== '')
        const users = lines.slice(1).map(line => {
            const [email, name, phone] = line.split(',').map(s => s.trim())
            return { email, name, phone }
        })

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ users }),
            })

            if (res.ok) {
                setMessage(`Successfully processed ${users.length} users.`)
            } else {
                const errorData = await res.json()
                setMessage(`Error: ${errorData.error}`)
            }
        } catch (error) {
            setMessage('Upload failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="glass border-white/10">
            <CardHeader>
                <CardTitle>학생 일괄 등록</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Input id="picture" type="file" accept=".csv" onChange={handleFileChange} />
                        <p className="text-xs text-gray-400">형식: email, name, phone (헤더 포함)</p>
                    </div>
                    <Button type="submit" disabled={loading || !file} className="w-full bg-black hover:bg-gray-800 text-white font-bold transition-colors">
                        {loading ? '업로드 중...' : 'CSV 업로드'}
                    </Button>
                    {message && <p className="text-sm text-gray-400 mt-2">{message}</p>}
                </form>
            </CardContent>
        </Card>
    )
}
