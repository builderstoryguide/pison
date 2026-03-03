'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  reportType: 'monthly-balance' | 'collection-journal' | 'client-statement' | 'commissions';
  params: Record<string, string>;
  labelPrefix?: string;
}

export default function ExportButton({ reportType, params, labelPrefix }: ExportButtonProps) {
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const searchParams = new URLSearchParams(params);
    searchParams.append('format', format);
    
    const url = `/api/reports/${reportType}/export?${searchParams.toString()}`;
    
    // Attempt to open in new tab
    const newWindow = window.open(url, '_blank');
    
    // Check if window.open was blocked (returns null when blocked by popup blocker)
    if (newWindow === null) {
      console.error('Export failed: Popup blocked. Attempting fallback download method.', {
        reportType,
        format,
        url
      });
      toast.error('Popup blocked. Using fallback download...');
      
      // Fallback: Create and click an anchor element to trigger download
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${reportType}-${format}-${Date.now()}`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      
      toast.success('Report export started');
    } else {
      toast.success('Report export started');
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
        <Download className="mr-2 size-4" />
        {labelPrefix ? `${labelPrefix} CSV` : 'CSV'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
        <Download className="mr-2 size-4" />
        {labelPrefix ? `${labelPrefix} Excel` : 'Excel'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
        <Download className="mr-2 size-4" />
        {labelPrefix ? `${labelPrefix} PDF` : 'PDF'}
      </Button>
    </div>
  );
}
