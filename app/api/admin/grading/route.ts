import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) return NextResponse.json({ error: 'Key missing' }, { status: 500 })

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)

    try {
        const { result_id, score, details, incorrects } = await request.json()

        if (!result_id) return NextResponse.json({ error: 'Result ID required' }, { status: 400 })

        // 1. Update Exam Result (Score & Details)
        const { error: updateError } = await supabaseAdmin
            .from('exam_results')
            .update({
                score: score,
                details: details
            })
            .eq('id', result_id)

        if (updateError) throw updateError

        // 2. Sync Incorrect Answers
        // First delete existing
        const { error: deleteError } = await supabaseAdmin
            .from('exam_incorrect_answers')
            .delete()
            .eq('result_id', result_id)

        if (deleteError) throw deleteError

        // Insert new
        if (incorrects && incorrects.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('exam_incorrect_answers')
                .insert(
                    incorrects.map((q: any) => ({
                        result_id: result_id,
                        question_number: q.question_number,
                        description: '오답'
                    }))
                )
            if (insertError) throw insertError
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Grading Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
