import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) return NextResponse.json({ error: 'Key missing' }, { status: 500 })

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)

    try {
        const { type, id, title, content, author } = await request.json()

        if (type === 'delete') {
            const { error } = await supabaseAdmin.from('notices').delete().eq('id', id)
            if (error) throw error
        } else {
            // Create
            const { error } = await supabaseAdmin.from('notices').insert({ title, content, author })
            if (error) throw error
        }

        revalidatePath('/notices')
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
