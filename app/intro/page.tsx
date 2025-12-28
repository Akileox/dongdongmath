import { PublicNavbar } from "@/components/layout/public-navbar"
import { Shield, BookOpen, CheckCircle } from "lucide-react"

export default function IntroPage() {
    return (
        <main className="min-h-screen bg-white text-gray-900">
            <PublicNavbar />
            <div className="pt-24 container mx-auto px-6 max-w-4xl py-20">
                <div className="text-center mb-16">
                    <div className="inline-block mb-4 px-4 py-1 bg-black text-white text-xs font-bold tracking-widest uppercase">
                        Philosophy
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 font-sans leading-tight">
                        수학, 그 이상의<br />
                        가치를 전달합니다.
                    </h1>
                    <p className="text-gray-500 text-lg font-light leading-relaxed">
                        Team DJ는 단순한 지식 전달을 넘어,<br />
                        치열한 시험장에서 흔들리지 않는 멘탈과 태도를 가르치고자 노력합니다.
                    </p>
                </div>

                <div className="grid gap-12">
                    <div className="flex flex-col md:flex-row gap-8 items-start bg-white border border-gray-100 p-8 hover:shadow-lg transition-shadow">
                        <div className="p-4 bg-gray-50 rounded-none border border-gray-200">
                            <Shield className="w-8 h-8 text-black" />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h3 className="text-xl font-bold mb-3 font-sans">프라이빗 클래스</h3>
                            <p className="text-gray-600 leading-relaxed">
                                철저한 관리 하에 운영되는 폐쇄형 학습 공간입니다.<br />
                                검증된 학생들과 함께 독보적인 면학 분위기를 조성합니다.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start bg-white border border-gray-100 p-8 hover:shadow-lg transition-shadow">
                        <div className="p-4 bg-gray-50 rounded-none border border-gray-200">
                            <BookOpen className="w-8 h-8 text-black" />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h3 className="text-xl font-bold mb-3 font-sans">최적화된 커리큘럼</h3>
                            <p className="text-gray-600 leading-relaxed">
                                자체 제작 교재와 고화질 강의를 통해<br />
                                가장 효율적이고 타협 없는 학습 경로를 제시합니다.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start bg-white border border-gray-100 p-8 hover:shadow-lg transition-shadow">
                        <div className="p-4 bg-gray-50 rounded-none border border-gray-200">
                            <CheckCircle className="w-8 h-8 text-black" />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h3 className="text-xl font-bold mb-3 font-sans">앞서가는 Q&A 시스템</h3>
                            <p className="text-gray-600 leading-relaxed">
                                질문에는 타임스탬프가 기록됩니다.<br />
                                AI 보조 시스템과 조교, 이동재T가 직접 빈틈을 메웁니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
