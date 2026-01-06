import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) return NextResponse.json({ error: 'Key missing' }, { status: 500 })

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)

    try {
        // 1. Upsert Exam Results
        const resultsToUpsert = scores.map((s: any) => ({
            exam_id: s.exam_id,
            student_id: s.student_id,
            score: s.score,
            feedback: s.feedback
        }))

        const { data: upsertedData, error } = await supabaseAdmin
            .from('exam_results')
            .upsert(resultsToUpsert, { onConflict: 'exam_id, student_id' })
            .select()

        if (error) throw error

        // 2. Handle Incorrect Answers
        // Map student_id back to result_id from upsertedData
        if (upsertedData) {
            for (const result of upsertedData) {
                const inputScore = scores.find((s: any) => s.student_id === result.student_id && s.exam_id === result.exam_id)
                if (inputScore && typeof inputScore.incorrects === 'string') {
                    // Clean incorrects string: "1, 3, 5" -> [1, 3, 5]
                    const incorrectString = inputScore.incorrects.trim()
                    let incorrectNumbers: number[] = []

                    if (incorrectString) {
                        incorrectNumbers = incorrectString.split(',')
                            .map((s: string) => parseInt(s.trim()))
                            .filter((n: number) => !isNaN(n))
                    }

                    // Delete existing
                    await supabaseAdmin
                        .from('exam_incorrect_answers')
                        .delete()
                        .eq('result_id', result.id)

                    // Insert new
                    if (incorrectNumbers.length > 0) {
                        const incorrectRows = incorrectNumbers.map(n => ({
                            result_id: result.id,
                            question_number: n,
                            description: '오답' // Default description
                        }))
                        await supabaseAdmin
                            .from('exam_incorrect_answers')
                            .insert(incorrectRows)
                    }
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
