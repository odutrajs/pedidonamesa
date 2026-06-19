import { cn } from '../../lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={cn('card', padding && 'p-4', className)}>{children}</div>
  );
}
