import { PublicNavbar } from "@/components/layout/public-navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AnswerSection } from "@/components/questions/answer-section"

export default async function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // DB Fetching
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: question, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !question) {
        return (
            <main className="min-h-screen bg-white text-gray-900 transition-colors">
                <PublicNavbar />
                <div className="pt-32 container mx-auto px-6 text-center">
                    <h1 className="text-2xl font-bold mb-4">질문을 찾을 수 없습니다.</h1>
                    <Button asChild><Link href="/questions">목록으로</Link></Button>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-white text-gray-900 transition-colors">
            <PublicNavbar />
            <div className="pt-24 container mx-auto px-6 max-w-4xl py-20">
                <Button variant="secondary" className="mb-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold" asChild>
                    <Link href="/questions">목록으로 돌아가기</Link>
                </Button>

                <div className="border-b border-gray-200 pb-6 mb-8">
                    <h1 className="text-3xl font-bold mb-4 font-sans">{question.title}</h1>
                    <div className="flex gap-4 text-sm text-gray-500">
                        <span>{question.author || '학생'}</span>
                        <span>{new Date(question.created_at).toLocaleDateString()}</span>
                        <span className="text-yellow-600">답변 대기중</span>
                    </div>
                </div>

                <div className="min-h-[200px] mb-8">
                    <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{question.content}</p>

                    {question.image_url && (
                        <div className="mt-6">
                            <img
                                src={question.image_url}
                                alt="질문 첨부 이미지"
                                className="rounded-xl border border-gray-200 max-h-[500px] object-contain bg-gray-50"
                            />
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-100 pt-8">
                    <h2 className="text-lg font-bold mb-4">답변</h2>
                    <AnswerSection question={question} />
                </div>
            </div>
        </main>
    )
}
