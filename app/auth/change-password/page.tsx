'use client'

import { useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.')
            return
        }
        if (password.length < 6) {
            alert('비밀번호는 6자 이상이어야 합니다.')
            return
        }

        setLoading(true)

        // Update password
        const { error } = await supabase.auth.updateUser({
            password: password,
            data: { must_change_password: false } // Reset flag
        })

        if (error) {
            alert('비밀번호 변경 실패: ' + error.message)
        } else {
            alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.')
            await supabase.auth.signOut()
            router.push('/login')
        }
        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">비밀번호 변경</CardTitle>
                    <CardDescription>
                        보안을 위해 초기 비밀번호를 변경해야 합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">새 비밀번호</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="6자 이상 입력"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">비밀번호 확인</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="비밀번호 재입력"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white font-bold h-11" disabled={loading}>
                            {loading ? '변경 중...' : '비밀번호 변경하기'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
