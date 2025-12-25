import { useState, useRef, useEffect, memo } from 'react'

/**
 * OptimizedImage - A performance-optimized image component
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur placeholder while loading
 * - Error handling with fallback
 * - Smooth fade-in animation
 */
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  fallback = null,
  aspectRatio = 'aspect-square',
  objectFit = 'object-cover',
  placeholderColor = 'bg-neutral-100',
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px', // Start loading slightly before in view
        threshold: 0.01,
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
  }

  if (hasError || !src) {
    return (
      <div
        ref={imgRef}
        className={`${aspectRatio} ${placeholderColor} flex items-center justify-center ${className}`}
      >
        {fallback}
      </div>
    )
  }

  return (
    <div ref={imgRef} className={`${aspectRatio} ${placeholderColor} relative overflow-hidden ${className}`}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full ${objectFit} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
      {/* Loading shimmer effect */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 animate-pulse" />
      )}
    </div>
  )
})

export default OptimizedImage
