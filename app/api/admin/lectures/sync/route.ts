import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use Service Role for Admin Write Access
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        const { playlistUrl, section } = await request.json()

        if (!playlistUrl || !section) {
            return NextResponse.json({ error: 'Playlist URL and Section are required' }, { status: 400 })
        }

        // 1. Normalize URL to ensure we fetch the "Playlist Page" (not Watch page)
        // If user provides "watch?v=...&list=...", we must extract list ID and convert to "playlist?list=..."
        let targetUrl = playlistUrl
        try {
            const urlObj = new URL(playlistUrl)
            const listId = urlObj.searchParams.get('list')
            if (listId) {
                targetUrl = `https://www.youtube.com/playlist?list=${listId}`
            }
        } catch (e) {
            // If URL parsing fails, simpler check or rely on fetch fail
            console.warn('URL parsing failed, using original', e)
        }

        // 1. Fetch Playlist Page HTML
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })
        const html = await response.text()

        // 2. Extract Videos using Regex
        // YouTube playlists store video info in `var ytInitialData = ...`
        // We look for "videoRenderer" items.
        // This is fragile but works without API key for personal use cases usually.
        // If this fails, we might need a library or API key.

        // Regex to find video IDs and titles
        // Pattern: "videoId":"(.*?)" ... "title":{"runs":[{"text":"(.*?)"}]}
        // This is complex to parse via Regex reliably. 
        // Better approach: Look for `playlistVideoListRenderer` in the JSON blob within HTML.

        const jsonMatch = html.match(/var ytInitialData = ({.*?});/)
        if (!jsonMatch) {
            return NextResponse.json({ error: 'Failed to parse YouTube Data' }, { status: 500 })
        }

        const ytData = JSON.parse(jsonMatch[1])
        const contents = ytData.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents

        if (!contents) {
            return NextResponse.json({ error: 'No videos found in playlist structure' }, { status: 404 })
        }

        const videos = []
        for (const item of contents) {
            if (item.playlistVideoRenderer) {
                const vid = item.playlistVideoRenderer
                const videoId = vid.videoId
                const title = vid.title?.runs?.[0]?.text
                const index = vid.index?.simpleText // 1, 2, 3...

                if (videoId && title) {
                    videos.push({
                        title: title,
                        youtube_link: `https://www.youtube.com/watch?v=${videoId}`,
                        section: section,
                        // We can't easily get 'learning_guide' from YouTube, default to empty
                        learning_guide: '',
                        // Use current time as created_at or try to preserve order?
                        // We should probably rely on the index for ordering if we had an 'order' column, 
                        // but currently we order by 'created_at'.
                        // So we should insert them in order, or slightly stagger created_at.
                        videoId
                    })
                }
            }
        }

        if (videos.length === 0) {
            return NextResponse.json({ error: 'No videos extracted' }, { status: 404 })
        }

        // 3. Upsert to Database
        let count = 0
        const baseTime = Date.now()

        for (const [i, video] of videos.entries()) {
            // Stagger created_at so sorting by created_at preserves playlist order
            // (First video = oldest created_at? Or newest? Usually List is 1..N)
            // If we want 1 to appear first in a list sorted by created_at ASC, 
            // then video 1 should have earliest timestamp.
            const staggeredTime = new Date(baseTime + (i * 1000)).toISOString()

            // Check if exists to avoid overwriting existing metadata if we want?
            // User said "Reflect changes". So upsert is good.
            // We match on `youtube_link` OR `title`? 
            // Ideally we should have a unique constraint on youtube_link.
            // But let's assume we want to update if link matches.

            // However, `lectures` table might not have unique constraint on link.
            // Let's check if it exists first.

            const { data: existing } = await supabaseAdmin
                .from('lectures')
                .select('id')
                .eq('youtube_link', video.youtube_link)
                .single()

            if (existing) {
                await supabaseAdmin.from('lectures').update({
                    title: video.title,
                    section: section,
                    // don't overwrite learning_guide if exists?
                    // or maybe user wants to sync title changes.
                }).eq('id', existing.id)
            } else {
                await supabaseAdmin.from('lectures').insert({
                    title: video.title,
                    section: section,
                    youtube_link: video.youtube_link,
                    learning_guide: '',
                    created_at: staggeredTime
                })
            }
            count++
        }

        return NextResponse.json({ success: true, count, videos: videos.map(v => v.title) })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
