import { ReactNode } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';

export function BrandedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid lg:grid-cols-2 grow">
      <div className="flex justify-center items-center p-8 lg:p-10 order-2 lg:order-1">
        <Card className="w-full max-w-[400px] border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg shadow-primary/10">
          <CardContent className="p-6">{children}</CardContent>
        </Card>
      </div>

      <div className="lg:rounded-xl lg:border lg:border-border lg:m-5 order-1 lg:order-2 bg-top xxl:bg-center xl:bg-cover bg-no-repeat branded-bg">
        <div className="flex flex-col p-8 lg:p-16 gap-4">
          <Link href="/">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.svg')}
              className="h-[28px] max-w-none"
              alt=""
            />
          </Link>

          <div className="flex flex-col gap-3">
            <h3 className="text-2xl font-semibold text-mono">
              Daily Collection Management System
            </h3>
            <div className="text-base font-medium text-secondary-foreground">
              Secure access to your&nbsp;
              <span className="text-mono font-semibold">
                microfinance management
              </span>
              <br /> platform for daily collections,
              <br /> client accounts, and financial operations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
