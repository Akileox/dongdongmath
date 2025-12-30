'use client'

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useUserRole } from "@/hooks/use-user-role"
import { Trash2 } from 'lucide-react'

export function QuestionActions({ questionId, status, authorId }: { questionId: string, status: string, authorId: string }) {
    const { user } = useUserRole()
    const router = useRouter()

    // Only show if user is the author and status is not answered
    const isAuthor = user?.id === authorId
    const canDelete = isAuthor && status !== 'answered'

    if (!canDelete) return null

    const handleDelete = async () => {
        if (!confirm('정말로 질문을 삭제하시겠습니까?')) return

        const supabase = createClient()
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', questionId)

        if (error) {
            alert('삭제 실패: ' + error.message)
        } else {
            alert('질문이 삭제되었습니다.')
            router.push('/questions')
            router.refresh()
        }
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 size={16} className="mr-2" />
            질문 삭제
        </Button>
    )
}
