'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

interface AssistantRegistrationProps {
    newAssistant: { id: string, realName: string, nickname: string, password: string, phone: string }
    setNewAssistant: (assistant: any) => void
    handleAssistantRegister: () => void
    loading: boolean
}

export function AssistantRegistration({
    newAssistant,
    setNewAssistant,
    handleAssistantRegister,
    loading
}: AssistantRegistrationProps) {
    return (
        <div className="grid gap-4 max-w-md border p-6 rounded-xl bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                    <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">조교 계정 생성</h3>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">아이디 (ID)</label>
                <div className="flex items-center gap-2">
                    <Input
                        value={newAssistant.id}
                        onChange={(e) => setNewAssistant({ ...newAssistant, id: e.target.value })}
                        placeholder="예: kevin"
                        className="flex-1"
                    />
                    <span className="text-sm text-gray-500 font-mono">@teamdj.com</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">실명 (관리용)</label>
                <Input
                    value={newAssistant.realName}
                    onChange={(e) => setNewAssistant({ ...newAssistant, realName: e.target.value })}
                    placeholder="예: 이승민"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">닉네임 (표시용)</label>
                <Input
                    value={newAssistant.nickname}
                    onChange={(e) => setNewAssistant({ ...newAssistant, nickname: e.target.value })}
                    placeholder="예: Kevin (저장 시 'Kevin T'로 변환됨)"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">초기 비밀번호</label>
                <Input
                    type="text"
                    value={newAssistant.password}
                    onChange={(e) => setNewAssistant({ ...newAssistant, password: e.target.value })}
                    placeholder="최소 6자 이상"
                />
                <p className="text-xs text-red-500">* 첫 로그인 시 비밀번호 변경이 강제됩니다.</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">전화번호</label>
                <Input
                    value={newAssistant.phone}
                    onChange={(e) => setNewAssistant({ ...newAssistant, phone: e.target.value })}
                    placeholder="010-0000-0000"
                />
            </div>

            <Button onClick={handleAssistantRegister} disabled={loading} variant="blue" className="w-full font-bold mt-4">
                {loading ? '생성 중...' : '조교 계정 생성'}
            </Button>
        </div>
    )
}
