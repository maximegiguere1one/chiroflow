import React from 'react';
import { User } from 'lucide-react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length];
}

export function Avatar({ src, alt, name, size = 'md', className = '' }: AvatarProps) {
  const baseStyles = 'rounded-full flex items-center justify-center font-medium overflow-hidden';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={`${baseStyles} ${sizeStyles[size]} object-cover ${className}`}
      />
    );
  }

  if (name) {
    const initials = getInitials(name);
    const colorClass = getColorFromName(name);

    return (
      <div
        className={`${baseStyles} ${sizeStyles[size]} ${colorClass} text-white ${className}`}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${sizeStyles[size]} bg-neutral-200 text-neutral-500 ${className}`}
    >
      <User className={iconSizes[size]} />
    </div>
  );
}

export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarGroup({ children, max = 3, size = 'md', className = '' }: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = max ? childArray.slice(0, max) : childArray;
  const remainingCount = childArray.length - visibleChildren.length;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visibleChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-white rounded-full">
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            ${sizeStyles[size]}
            rounded-full bg-neutral-200 text-neutral-700
            flex items-center justify-center font-medium text-xs
            ring-2 ring-white
          `}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
