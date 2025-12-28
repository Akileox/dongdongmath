'use client'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css' // Import Katex CSS

export function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    img: ({ node, ...props }) => (
                        <img {...props} className="rounded-lg border border-gray-200 bg-gray-50 max-h-[400px] object-contain my-2" />
                    ),
                    p: ({ node, ...props }) => (
                        <p {...props} className="leading-relaxed whitespace-pre-wrap mb-2 last:mb-0" />
                    ),
                    a: ({ node, ...props }) => (
                        <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
