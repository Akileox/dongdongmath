'use client'

import { QuestionForm } from "@/components/questions/question-form"

export function QAPreview() {
    return (
        <div className="max-w-2xl mx-auto p-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="mb-6 text-center">
                <h2 className="text-xl font-bold mb-2">질문 작성 미리보기</h2>
                <p className="text-sm text-gray-500">학생이 강의 수강 중 질문을 남길 때 보여지는 화면입니다.</p>
            </div>

            {/* Mocking the QuestionForm props */}
            <QuestionForm
                lectureId="preview-lecture-id"
                timestamp={125}
                userId="preview-user"
                onClose={() => alert("질문 창 닫기 이벤트 발생")}
            />
        </div>
    )
}