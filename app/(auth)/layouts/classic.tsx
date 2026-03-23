import { ReactNode } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';

export function ClassicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center grow bg-center bg-no-repeat page-bg">
      <div className="m-5">
        <Link href="/">
          <img
            src={toAbsoluteUrl('/media/app/mini-logo.svg')}
            className="h-[35px] max-w-none"
            alt=""
          />
        </Link>
      </div>
      <Card className="w-full max-w-[400px] border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg shadow-primary/10">
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );
}
