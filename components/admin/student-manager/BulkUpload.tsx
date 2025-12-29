'use client'

import { Button } from "@/components/ui/button"

interface BulkUploadProps {
    rawText: string
    setRawText: (text: string) => void
    handleBulkUpload: () => void
    loading: boolean
    uploadResult: { success: number, fail: number, errors: string[] } | null
}

export function BulkUpload({
    rawText,
    setRawText,
    handleBulkUpload,
    loading,
    uploadResult
}: BulkUploadProps) {
    return (
        <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg text-sm text-orange-800 mb-4">
                <strong>사용 가이드:</strong><br />
                1. 엑셀에서 <strong>[이름] [전화번호] [학년] [학교]</strong> 순서로 드래그하여 복사하세요.<br />
                2. 아래 텍스트 상자에 붙여넣기 하세요.<br />
                3. '일괄 생성' 버튼을 누르면 계정이 자동 생성됩니다. (초기 비번: 123456*)
            </div>
            <textarea
                className="w-full h-60 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:ring-1 focus:ring-black"
                placeholder={`예시:\n김철수\t010-1234-5678\t고1\t세화고\n이영희\t010-9876-5432\t중3\t서문여중`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
            />
            <Button
                onClick={handleBulkUpload}
                disabled={loading || !rawText.trim()}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold h-12 shadow-sm"
            >
                {loading ? '처리 중...' : '엑셀 데이터 일괄 생성'}
            </Button>

            {uploadResult && (
                <div className={`p-4 rounded-lg text-sm space-y-2 ${uploadResult.fail > 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                    <p className="font-bold">
                        {uploadResult.success}명 생성 성공
                        {uploadResult.fail > 0 && `, ${uploadResult.fail}명 실패`}
                    </p>
                    {uploadResult.errors.length > 0 && (
                        <ul className="list-disc pl-4 text-xs space-y-1 opacity-80 max-h-32 overflow-y-auto">
                            {uploadResult.errors.map((e, i) => (
                                <li key={i}>{e}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
