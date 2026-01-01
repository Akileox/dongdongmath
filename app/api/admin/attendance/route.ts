import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) return NextResponse.json({ error: 'Key missing' }, { status: 500 })

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)

    try {
        const { studentId, date, status } = await request.json()

        if (status === 'none') {
            const { error } = await supabaseAdmin
                .from('attendance')
                .delete()
                .match({ user_id: studentId, date })
            if (error) throw error
        } else {
            const { error } = await supabaseAdmin
                .from('attendance')
                .upsert({ user_id: studentId, date, status })
            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
