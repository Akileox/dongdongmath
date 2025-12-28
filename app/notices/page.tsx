import { PublicNavbar } from "@/components/layout/public-navbar"
import Link from "next/link"

export default async function NoticesPage() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Simple fetch without SDK or using SDK with just URL/Key
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: notices } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <main className="min-h-screen bg-white text-gray-900">
            <PublicNavbar />
            <div className="pt-24 container mx-auto px-6 max-w-4xl py-20">
                <h1 className="text-3xl font-bold mb-8 pb-4 border-b border-gray-900 font-sans">공지사항</h1>

                <div className="w-full">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200 font-medium text-sm text-gray-600">
                        <span className="w-16 text-center">번호</span>
                        <span className="flex-1 text-center">제목</span>
                        <span className="w-24 text-center">작성자</span>
                        <span className="w-24 text-center">작성일</span>
                    </div>

                    {(!notices || notices.length === 0) && (
                        <div className="py-12 text-center text-gray-500">
                            등록된 공지사항이 없습니다.
                        </div>
                    )}

                    {notices && notices.map((notice: any, index: number) => (
                        <Link href={`/notices/${notice.id}`} key={notice.id} className="block">
                            <div className="flex justify-between items-center py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer text-sm">
                                <span className="w-16 text-center text-gray-500">{notices.length - index}</span>
                                <span className="flex-1 px-4 font-normal text-gray-900">{notice.title}</span>
                                <span className="w-24 text-center text-gray-500">{notice.author || '관리자'}</span>
                                <span className="w-24 text-center text-gray-400">
                                    {new Date(notice.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}
