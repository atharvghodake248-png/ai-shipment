'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={`animate-spin text-violet-400 ${sizeClasses[size]} ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center bg-[#09090B]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function CardLoader() {
  return (
    <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/70">
      <LoadingSpinner size="md" />
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-md bg-zinc-800 ${className}`} />
  );
}