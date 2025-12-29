import { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import { User } from '@supabase/supabase-js'

export function useUserRole() {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function getUserParam() {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (user) {
                setUser(user)

                // Always fetch from profiles to get the latest role state
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle() // Use maybeSingle to avoid error on 0 rows

                if (profile) {
                    setRole(profile.role)
                } else {
                    console.log('No profile found, falling back to metadata')
                    // Fallback to metadata or default
                    setRole(user.user_metadata?.role || 'student')
                }
            }
            setLoading(false)
        }
        getUserParam()
    }, [])

    return { user, role, loading, isAdmin: role === 'admin' || role === 'assistant' }
}
