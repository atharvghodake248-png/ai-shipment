'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card className="max-w-md text-center">
        <CardHeader>
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
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
      <Card className="border-dashed max-w-md text-center">
        <CardContent className="py-12">
          {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-sm mb-4">{description}</p>
          )}
          {action}
        </CardContent>
      </Card>
    </div>
  );
}
