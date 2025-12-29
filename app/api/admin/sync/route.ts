import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    return POST()
}

export async function POST() {
    // Check for Service Role Key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Service Role Key missing' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            }
        }
    )

    try {
        // 1. Get all users from Auth (limit 1000 for simplicity or use pagination if huge)
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        if (authError) throw authError

        const results = { synced: 0, errors: 0 }

        for (const user of users) {
            // Always upsert to ensure sync
            const { error: upsertError } = await supabaseAdmin.from('profiles').upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata.full_name,
                phone: user.user_metadata.phone,
                grade: user.user_metadata.grade,
                school: user.user_metadata.school,
                role: user.user_metadata.role || 'student',
                class_section: user.user_metadata.class_section
            }, { onConflict: 'id' })

            if (!upsertError) results.synced++
            else results.errors++
        }

        return NextResponse.json({ message: 'Sync complete', results })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
