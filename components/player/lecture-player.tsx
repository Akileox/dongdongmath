'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { HelpCircle } from 'lucide-react'
import { QuestionForm } from "@/components/questions/question-form"

// Dynamically import valid YouTube component
import YouTube, { YouTubeProps } from 'react-youtube'

// Helper to extract YouTube ID
function getYouTubeId(url: string) {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
}

interface LecturePlayerProps {
    url: string
    lectureId: string
    userId: string
}

export function LecturePlayer({ url, lectureId, userId }: LecturePlayerProps) {
    const [showQuestionForm, setShowQuestionForm] = useState(false)
    const [currentTimestamp, setCurrentTimestamp] = useState(0)
    const [player, setPlayer] = useState<any>(null)
    const videoId = getYouTubeId(url)

    const onReady: YouTubeProps['onReady'] = (event) => {
        setPlayer(event.target)
    }

    const handleAskQuestion = async () => {
        if (player && typeof player.getCurrentTime === 'function') {
            const time = await player.getCurrentTime()
            setCurrentTimestamp(Math.floor(time))
            player.pauseVideo()
        }
        setShowQuestionForm(true)
    }

    const handleCloseForm = () => {
        setShowQuestionForm(false)
        if (player && typeof player.playVideo === 'function') {
            player.playVideo()
        }
    }

    if (!videoId) {
        return (
            <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center text-gray-500">
                <p>유효하지 않은 동영상 링크입니다.</p>
            </div>
        )
    }

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
            rel: 0,
            modestbranding: 1,
        },
    }

    return (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-gray-800">
            <div className="absolute inset-0">
                <YouTube
                    videoId={videoId}
                    opts={opts}
                    onReady={onReady}
                    className="w-full h-full"
                    iframeClassName="w-full h-full"
                />
            </div>

            {/* Overlay controls */}
            <div className="absolute top-4 right-4 z-10">
                <Button
                    onClick={handleAskQuestion}
                    className="bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg gap-2"
                >
                    <HelpCircle size={18} />
                    질문하기 ({formatTime(currentTimestamp)})
                </Button>
            </div>

            {showQuestionForm && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-lg">
                        <QuestionForm
                            lectureId={lectureId}
                            userId={userId}
                            timestamp={currentTimestamp}
                            onClose={handleCloseForm}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min}:${sec < 10 ? '0' : ''}${sec}`
}
