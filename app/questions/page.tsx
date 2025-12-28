import { PublicNavbar } from "@/components/layout/public-navbar"
import Link from "next/link"

export default async function QuestionsPage() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Server fetch
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Assuming we have a 'questions' table
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <main className="min-h-screen bg-white text-gray-900">
            <PublicNavbar />
            <div className="pt-24 container mx-auto px-6 max-w-4xl py-20">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-900">
                    <h1 className="text-3xl font-bold font-sans">질문게시판</h1>
                    <Link href="/questions/create">
                        <button className="px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg active:scale-95">
                            질문하기
                        </button>
                    </Link>
                </div>

                <div className="w-full">
                    <div className="flex justify-between items-center py-3 border-b-2 border-gray-900 text-sm font-bold text-gray-900">
                        <span className="w-24 text-center">작성일</span>
                        <span className="flex-1 text-center">제목</span>
                        <span className="w-24 text-center">작성자</span>
                        <span className="w-24 text-center">답변여부</span>
                    </div>

                    {(!questions || questions.length === 0) && (
                        <div className="py-12 text-center text-gray-500">
                            등록된 질문이 없습니다.
                        </div>
                    )}

                    {questions && questions.map((q: any) => (
                        <Link href={`/questions/${q.id}`} key={q.id} className="block">
                            <div className="flex justify-between items-center py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer text-sm">
                                <span className="w-24 text-center text-gray-500">
                                    {new Date(q.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex-1 px-4 font-normal text-gray-900 flex items-center gap-2">
                                    {q.status === 'answered' && <span className="text-xs">🔒</span>}
                                    {q.title}
                                    {q.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1 rounded">N</span>}
                                </span>
                                <span className="w-24 text-center text-gray-500">{q.author || '학생'}</span>
                                <span className={`w-24 text-center ${q.status === 'answered' ? 'text-orange-500' : 'text-gray-400'}`}>
                                    {q.status === 'answered' ? '답변 완료' : '답변 대기'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}
