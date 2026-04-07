import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppLogoProps = {
  className?: string;
  textClassName?: string;
  iconWrapClassName?: string;
  iconClassName?: string;
  showText?: boolean;
};

export default function AppLogo({
  className,
  textClassName,
  iconWrapClassName,
  iconClassName,
  showText = true,
}: AppLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full border border-[#dce7fb] bg-[#eef4ff]',
          iconWrapClassName
        )}
      >
        <HeartPulse className={cn('h-5 w-5 text-[#2f73ec]', iconClassName)} strokeWidth={2.2} />
      </div>
      {showText && <span className={cn('text-3xl font-bold text-[#111a2b]', textClassName)}>PulseGym</span>}
    </div>
  );
}
