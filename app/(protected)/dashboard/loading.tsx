import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="w-full mx-auto px-4 lg:px-6 max-w-[1320px] py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-5 lg:gap-7.5 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-5 lg:gap-7.5 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="md:col-span-2 lg:col-span-4 h-64 rounded-lg" />
        <Skeleton className="md:col-span-2 lg:col-span-3 h-64 rounded-lg" />
      </div>
    </div>
  );
}
