'use client';


export function ScreenLoader() {
  return (
    <div className="flex flex-col items-center gap-2 justify-center fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-700 ease-in-out">
      <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="text-muted-foreground font-medium text-sm">
        Loading...
      </div>
    </div>
  );
}
