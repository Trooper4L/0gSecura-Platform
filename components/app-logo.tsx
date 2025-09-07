import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  return <ShieldCheck className={cn("w-6 h-6 text-white", className)} />;
}

