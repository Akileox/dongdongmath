'use client'

import { Button } from "@/components/ui/button"
import { PlayCircle, FileText, HelpCircle } from "lucide-react"

export function LecturePreview() {
    return (
        <div className="space-y-6 p-6 border border-gray-200 rounded-lg bg-white">
            {/* Video Player Mock */}
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative group cursor-pointer overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="w-20 h-20 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 h-1 bg-gray-600 rounded">
                    <div className="w-1/3 h-full bg-white rounded"></div>
                </div>
                <p className="absolute top-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded">Preview Mode</p>
            </div>

            {/* Lecture Info */}
            <div>
                <h1 className="text-2xl font-bold mb-2">01. 지수함수의 그래프와 평행이동</h1>
                <p className="text-gray-500">2026 수능 대비 수학 I The Starter &gt; 1강</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-6">
                    <button className="py-2 px-1 border-b-2 border-black font-bold text-sm">강의 소개</button>
                    <button className="py-2 px-1 text-gray-500 hover:text-black font-medium text-sm transition-colors">강의 자료</button>
                    <button className="py-2 px-1 text-gray-500 hover:text-black font-medium text-sm transition-colors">질문하기</button>
                </div>
            </div>

            {/* Content Mock */}
            <div className="py-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded border border-gray-100">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                        <FileText size={16} /> 핵심 요약 노트
                    </h3>
                    <p className="text-sm text-gray-600">본 강의에서 다루는 지수함수의 주요 성질과 그래프 개형에 대한 요약 정리본입니다. 다운로드하여 활용하세요.</p>
                </div>

                <div className="p-4 bg-gray-50 rounded border border-gray-100">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                        <HelpCircle size={16} /> 학습 가이드
                    </h3>
                    <p className="text-sm text-gray-600">반드시 예제 1, 2번을 먼저 풀어보고 강의를 수강하는 것을 권장합니다.</p>
                </div>
            </div>
        </div>
    )
}
