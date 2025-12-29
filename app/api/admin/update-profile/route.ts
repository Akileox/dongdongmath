import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Service Role Key missing' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    )

    try {
        const { id, updates } = await request.json()

        if (!id || !updates) {
            return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 })
        }

        // Update Profile in DB
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // If updating role or name, we might also want to sync to Auth Metadata if needed,
        // but typically profile is the source of truth for the app.
        // However, if we changed the role, we SHOULD update auth metadata to ensure middleware works immediately.
        if (updates.role || updates.full_name || updates.name) {
            const metadataUpdates: any = {}
            if (updates.role) metadataUpdates.role = updates.role
            if (updates.full_name) metadataUpdates.full_name = updates.full_name
            if (updates.name) metadataUpdates.name = updates.name // fallback

            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
                user_metadata: metadataUpdates
            })
            if (authError) console.error('Auth metadata update failed:', authError)
        }

        return NextResponse.json({ success: true, user: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
