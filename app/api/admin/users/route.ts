import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
        const { users } = await request.json()

        const results = []

        for (const user of users) {
            // Create user in Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: user.email,
                password: 'tempPassword123!', // Default password, should be changed or randomized
                email_confirm: true,
                user_metadata: { full_name: user.name, phone: user.phone }
            })

            if (authError) {
                results.push({ email: user.email, status: 'error', error: authError.message })
            } else {
                results.push({ email: user.email, status: 'success', id: authData.user.id })
                // Trigger in database handles profile creation
            }
        }

        return NextResponse.json({
            message: 'Batch processing complete',
            results
        })

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
