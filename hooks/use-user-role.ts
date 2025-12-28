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
                // Check metadata first
                if (user.user_metadata?.role) {
                    setRole(user.user_metadata.role)
                } else {
                    // Fallback to profiles table if needed (legacy)
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    if (profile) {
                        setRole(profile.role)
                    }
                }
            }
            setLoading(false)
        }
        getUserParam()
    }, [])

    return { user, role, loading, isAdmin: role === 'admin' || role === 'assistant' }
}
