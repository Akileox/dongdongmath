import { PublicNavbar } from "@/components/layout/public-navbar"
import Link from "next/link"
import { QuestionBoard } from "@/components/questions/question-board"

export default function QuestionsPage() {
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

                <QuestionBoard />
            </div>
        </main>
    )
}
