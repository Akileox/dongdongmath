'use client'

import { useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from 'next/navigation'

export function LoginForm() {
    const [id, setId] = useState('') // Changed email to id
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Treat ID as email by appending a default domain
        const email = `${id}@teamdj.com`

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password,
        })

        if (error) {
            alert('로그인 실패: 아이디 또는 비밀번호를 확인해주세요.') // Changed error handling
        } else {
            router.push('/dashboard') // Redirect after login
        }
        setLoading(false) // Moved setLoading(false) to always run
    }

    return (
        <Card className="w-full shadow-lg border-gray-100 bg-white">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center text-gray-900">강의실 입장하기</CardTitle>
                <CardDescription className="text-center text-gray-500">
                    안내받은 아이디와 비밀번호로 입장해주세요.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="id" className="text-sm font-bold text-gray-700 block">아이디</label>
                        <Input
                            id="id"
                            type="text" // Changed type to text
                            placeholder="아이디 입력" // Changed placeholder
                            value={id} // Changed value to id
                            onChange={(e) => setId(e.target.value)} // Changed onChange to setId
                            required
                            className="bg-white border-gray-300 focus:border-black focus:ring-black transition-all" // Updated className
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-bold text-gray-700 block">비밀번호</label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="비밀번호 입력" // Updated placeholder
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-white border-gray-300 focus:border-black focus:ring-black transition-all" // Updated className
                        />
                    </div>
                    {/* Removed error display div */}
                    <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white font-bold h-11 text-md shadow-md transition-transform active:scale-[0.98]" disabled={loading}> {/* Updated className and text */}
                        {loading ? '입장 중...' : '입장하기'} {/* Updated button text */}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
