"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

export default function QRLoading({ count }: { count?: number }) {
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    // Show "taking longer than expected" message after 10 seconds
    const longWaitTimer = setTimeout(() => {
      setShowLongWaitMessage(true)
    }, 10000)

    // Update elapsed time counter
    const counterInterval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    return () => {
      clearTimeout(longWaitTimer)
      clearInterval(counterInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 pb-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Book Loader Animation */}
            <div className="loader">
              <div className="book">
                <div className="page" />
                <div className="page page2" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-primary">
                Generating QR Codes...
              </h2>
              <p className="text-muted-foreground">
                {count ? `Creating ${count.toLocaleString()} QR code${count > 1 ? 's' : ''}` : 'Please wait'}
              </p>
              
              {showLongWaitMessage ? (
                <div className="space-y-2 mt-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-500 font-semibold">
                    ⏳ Taking longer than expected...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please wait, this can take a few minutes for large batches.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Elapsed time: {elapsedSeconds}s
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This may take a moment
                </p>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        .loader {
          width: fit-content;
          height: fit-content;
          display: flex;
          align-items: center;
          justify-content: center;
          --book-color: #f1775b;
          --book-cover-color: #506c86;
        }
        .book {
          width: 150px;
          height: 13px;
          background-color: var(--book-color);
          border-bottom: 2px solid var(--book-cover-color);
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          position: relative;
        }
        .page {
          width: 50%;
          height: 2px;
          background-color: var(--book-color);
          animation: paging 0.7s ease-out infinite;
          transform-origin: left;
        }
        .page2 {
          width: 50%;
          height: 2px;
          background-color: var(--book-color);
          animation: paging 0.8s ease-out infinite;
          transform-origin: left;
          position: absolute;
        }
        @keyframes paging {
          10% {
            transform: rotateZ(0deg);
          }
          100% {
            transform: rotateZ(-180deg);
          }
        }
      `}</style>
    </div>
  )
}
