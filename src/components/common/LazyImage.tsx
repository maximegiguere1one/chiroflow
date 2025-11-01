import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3C/svg%3E',
  threshold = 0.1,
  onLoad,
  onError,
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!imageRef) return;

    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observerRef.current?.disconnect();
            }
          });
        },
        { threshold }
      );

      observerRef.current.observe(imageRef);
    } else {
      setImageSrc(src);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [imageRef, src, threshold]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setImageSrc(placeholder);
    onError?.();
  };

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'blur-sm' : ''} transition-all duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
    />
  );
}

interface OptimizedImageProps extends LazyImageProps {
  width?: number;
  height?: number;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  quality = 80,
  ...props
}: OptimizedImageProps) {
  const optimizedSrc = src.includes('supabase.co')
    ? `${src}?width=${width}&height=${height}&quality=${quality}&format=webp`
    : src;

  return (
    <LazyImage
      src={optimizedSrc}
      alt={alt}
      className={className}
      {...props}
    />
  );
}

export function AvatarImage({
  src,
  name,
  size = 'md',
  className = '',
}: {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-amber-500',
  ];

  const colorIndex = name.length % colors.length;
  const bgColor = colors[colorIndex];

  if (!src) {
    return (
      <div
        className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={name}
      width={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
      height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
    />
  );
}
