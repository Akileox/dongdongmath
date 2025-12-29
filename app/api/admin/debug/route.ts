import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) return NextResponse.json({ error: 'Key missing' })

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    )

    // Full System Audit
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const { data: profiles, error: dbError } = await supabaseAdmin.from('profiles').select('*')

    if (authError || dbError) return NextResponse.json({ error: 'Fetch failed', authError, dbError })

    const discrepancies: any[] = []
    const results = users.map(u => {
        const profile = profiles?.find(p => p.id === u.id)

        // Check Role Sync
        const authRole = u.user_metadata?.role
        const dbRole = profile?.role

        let status = 'ok'
        if (!profile) status = 'missing_profile'
        else if (authRole !== dbRole) {
            status = 'role_mismatch'
            discrepancies.push({ email: u.email, authRole, dbRole })
        }

        return { email: u.email, status, authRole, dbRole }
    })

    return NextResponse.json({
        summary: `Total Users: ${users.length}, Discrepancies: ${discrepancies.length}`,
        discrepancies,
        details: results
    })
}
