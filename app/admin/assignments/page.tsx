'use client'

import { AssignmentManager } from "@/components/admin/assignment-manager"

export default function AssignmentPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <h1 className="text-3xl font-bold">과제 관리</h1>
            <AssignmentManager />
        </div>
    )
}
