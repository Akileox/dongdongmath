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
    const [isPlaying, setIsPlaying] = useState(false)

    const togglePlay = () => {
        if (!videoRef.current) return
        if (isPlaying) {
            videoRef.current.pause()
        } else {
            videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    return (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video group border border-gray-800">
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                onEnded={() => setIsPlaying(false)}
                controls={false} // Custom controls
            />

            {/* Overlay Controls */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20 rounded-full w-12 h-12">
                    {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                </Button>
            </div>

            {/* Remove Button */}
            {editable && onRemove && (
                <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors z-10"
                >
                    <X size={14} />
                </button>
            )}

            {/* Bottom Bar (Optional) */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => videoRef.current?.requestFullscreen()} className="text-white hover:text-gray-200 h-6 w-6">
                    <Maximize size={14} />
                </Button>
            </div>
        </div>
    )
}
