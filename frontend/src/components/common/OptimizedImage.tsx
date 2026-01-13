/**
 * ============================================
 * OPTIMIZED IMAGE COMPONENT
 * ============================================
 * 
 * Lazy loading images with Intersection Observer,
 * WebP support with fallback, and blur-up loading.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  containerClassName?: string;
  placeholder?: 'blur' | 'skeleton' | 'none';
  blurDataUrl?: string;
  webpSrc?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
}

interface ImageWithWebPProps extends OptimizedImageProps {
  sources?: Array<{
    srcSet: string;
    type: string;
    media?: string;
  }>;
}

// ============================================
// USE INTERSECTION OBSERVER HOOK
// ============================================

function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isIntersecting];
}

// ============================================
// USE IMAGE LOADER HOOK
// ============================================

function useImageLoader(src: string | undefined) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    setLoaded(false);
    setError(false);

    const img = new Image();
    img.src = src;

    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { loaded, error };
}

// ============================================
// SKELETON PLACEHOLDER
// ============================================

const ImageSkeleton = memo(function ImageSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200 flex items-center justify-center',
        className
      )}
    >
      <svg
        className="w-10 h-10 text-gray-300"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    </div>
  );
});

// ============================================
// BLUR PLACEHOLDER
// ============================================

const BlurPlaceholder = memo(function BlurPlaceholder({
  blurDataUrl,
  className,
}: {
  blurDataUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx('absolute inset-0', className)}
      style={{
        backgroundImage: blurDataUrl ? `url(${blurDataUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(20px)',
        transform: 'scale(1.1)',
      }}
    />
  );
});

// ============================================
// OPTIMIZED IMAGE COMPONENT
// ============================================

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  placeholder = 'skeleton',
  blurDataUrl,
  webpSrc,
  fallbackSrc,
  loading = 'lazy',
  onLoad,
  onError,
  objectFit = 'cover',
  priority = false,
}: OptimizedImageProps) {
  const [ref, isIntersecting] = useIntersectionObserver();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(undefined);

  // Determine if we should load the image
  const shouldLoad = priority || isIntersecting;

  // Set the current source when we should load
  useEffect(() => {
    if (shouldLoad && !currentSrc) {
      setCurrentSrc(src);
    }
  }, [shouldLoad, src, currentSrc]);

  const handleLoad = useCallback(() => {
    setHasLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
      onError?.();
    }
  }, [fallbackSrc, currentSrc, onError]);

  const objectFitClass = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  };

  return (
    <div
      ref={ref}
      className={clsx('relative overflow-hidden', containerClassName)}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!hasLoaded && !hasError && (
        <>
          {placeholder === 'blur' && blurDataUrl && (
            <BlurPlaceholder blurDataUrl={blurDataUrl} />
          )}
          {placeholder === 'skeleton' && (
            <ImageSkeleton className="absolute inset-0" />
          )}
        </>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      )}

      {/* Actual Image */}
      {shouldLoad && currentSrc && !hasError && (
        <picture>
          {/* WebP source if available */}
          {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
          
          <img
            src={currentSrc}
            alt={alt}
            loading={priority ? 'eager' : loading}
            onLoad={handleLoad}
            onError={handleError}
            className={clsx(
              'transition-opacity duration-300',
              objectFitClass[objectFit],
              hasLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </picture>
      )}
    </div>
  );
});

// ============================================
// IMAGE WITH WEBP SOURCES
// ============================================

export const ImageWithWebP = memo(function ImageWithWebP({
  src,
  alt,
  sources,
  className,
  ...props
}: ImageWithWebPProps) {
  return (
    <picture className={className}>
      {sources?.map((source, index) => (
        <source
          key={index}
          srcSet={source.srcSet}
          type={source.type}
          media={source.media}
        />
      ))}
      <OptimizedImage src={src} alt={alt} className={className} {...props} />
    </picture>
  );
});

// ============================================
// AVATAR WITH LAZY LOADING
// ============================================

interface LazyAvatarProps {
  src?: string;
  alt: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LazyAvatar = memo(function LazyAvatar({
  src,
  alt,
  name,
  size = 'md',
  className,
}: LazyAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src || hasError) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center rounded-full bg-gold-100 text-gold-700 font-medium',
          sizes[size],
          className
        )}
      >
        {getInitials(name || alt)}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={clsx('rounded-full', sizes[size], className)}
      containerClassName={clsx('rounded-full', sizes[size])}
      objectFit="cover"
      placeholder="skeleton"
      onError={() => setHasError(true)}
    />
  );
});

// ============================================
// BACKGROUND IMAGE WITH LAZY LOADING
// ============================================

interface LazyBackgroundProps {
  src: string;
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
}

export const LazyBackground = memo(function LazyBackground({
  src,
  className,
  children,
  overlay = false,
  overlayOpacity = 0.5,
}: LazyBackgroundProps) {
  const [ref, isIntersecting] = useIntersectionObserver();
  const { loaded } = useImageLoader(isIntersecting ? src : undefined);

  return (
    <div
      ref={ref}
      className={clsx('relative', className)}
      style={{
        backgroundImage: loaded ? `url(${src})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      <div className="relative z-10">{children}</div>
    </div>
  );
});

// ============================================
// GENERATE BLUR DATA URL
// ============================================

export function generateBlurDataUrl(
  color: string = '#e5e7eb'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 5">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="1" />
      </filter>
      <rect preserveAspectRatio="none" filter="url(#b)" 
        x="0" y="0" height="100%" width="100%" fill="${color}" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
}

// ============================================
// IMAGE PRELOADER
// ============================================

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = reject;
  });
}

export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}
