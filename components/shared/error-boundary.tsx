'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading data. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full text-center rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl p-8">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-7 w-7 text-rose-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">{message}</p>
        {onRetry && (
          <Button onClick={onRetry}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-8">
      <div className="max-w-md w-full text-center rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/40 py-12 px-8">
        {icon && <div className="text-zinc-500 mb-4 flex justify-center">{icon}</div>}
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        {description && (
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">{description}</p>
        )}
        {action}
      </div>
    </div>
  );
}