'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { PageNavbar } from '@/app/(protected)/account/page-navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const usernameFormSchema = z.object({
  newUsername: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    )
    .transform((val) => val.trim()),
  currentPassword: z.string().min(1, 'Current password is required'),
});

type UsernameFormValues = z.infer<typeof usernameFormSchema>;

export default function ChangeUsernamePage() {
  const { t } = useTranslation();
  const { update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: {
      newUsername: '',
      currentPassword: '',
    },
  });

  async function onSubmit(data: UsernameFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/account/username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newUsername: data.newUsername,
          currentPassword: data.currentPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update username');
      }

      await updateSession({
        user: { username: result.data?.username ?? data.newUsername },
      });
      toast.success(t('pages.account.usernameUpdated'));
      form.reset();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update username'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <PageNavbar />
      <div className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.account.changeUsername')}</CardTitle>
              <CardDescription>
                {t('pages.account.changeUsernameDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="newUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.account.newUsername')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder={t('pages.account.newUsernamePlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.account.currentPassword')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t('pages.account.currentPasswordPlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t('pages.account.updateUsername')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
