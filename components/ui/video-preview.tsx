'use client'

import { useRef, useState } from 'react'
import { Play, Pause, Maximize, X } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface VideoPreviewProps {
    src: string
    onRemove?: () => void
    editable?: boolean
}

export function VideoPreview({ src, onRemove, editable = false }: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)

    const togglePlay = () => {
        if (!videoRef.current) return
        if (isPlaying) {
            videoRef.current.pause()
        } else {
            videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setProgress(videoRef.current.currentTime)
        }
    }

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration)
        }
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value)
        if (videoRef.current) {
            videoRef.current.currentTime = time
            setProgress(time)
        }
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!videoRef.current) return

        if (e.key === 'ArrowLeft') {
            e.preventDefault()
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
        } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5)
        } else if (e.key === ' ') {
            e.preventDefault()
            togglePlay()
        }
    }

    const handleFullscreen = () => {
        if (containerRef.current) {
            if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen()
            } else {
                document.exitFullscreen()
            }
        }
    }

    return (
        <div
            ref={containerRef}
            className="relative rounded-lg overflow-hidden bg-black aspect-video group border border-gray-800 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                controls={false}
                onClick={togglePlay} // Allow clicking video to play/pause
            />

            {/* Overlay Center Play Button */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                    <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm">
                        <Play size={32} fill="white" className="text-white ml-1" />
                    </div>
                </div>
            )}

            {/* Remove Button */}
            {editable && onRemove && (
                <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors z-10"
                >
                    <X size={14} />
                </button>
            )}

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                {/* Progress Bar */}
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-1.5 transition-all"
                />

                <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2">
                        <button onClick={togglePlay} className="text-white hover:text-blue-400">
                            {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
                        </button>
                        <span className="text-xs text-gray-300 font-mono">
                            {formatTime(progress)} / {formatTime(duration)}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleFullscreen} className="text-white hover:text-blue-400 h-6 w-6">
                        <Maximize size={14} />
                    </Button>
                </div>
            </div>
        </div>
    )
}
