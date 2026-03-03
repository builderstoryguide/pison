'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoaderCircleIcon } from 'lucide-react';
import {
  ChangePasswordSchemaType,
  getChangePasswordSchema,
} from '../forms/change-password-schema';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;

  const [verifyingToken, setVerifyingToken] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] =
    useState(false);

  const form = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(getChangePasswordSchema()),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setVerifyingToken(true);

        const response = await apiFetch('/api/auth/reset-password-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setIsValidToken(true);
        } else {
          const errorData = await response.json();
          setError(errorData.message || t('pages.auth.changePassword.invalidOrExpiredToken'));
        }
      } catch {
        setError(t('pages.auth.changePassword.unableVerifyToken'));
      } finally {
        setVerifyingToken(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setError(t('pages.auth.changePassword.noToken'));
    }
  }, [token, t]);

  async function onSubmit(values: ChangePasswordSchemaType) {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: values.newPassword }),
      });

      if (response.ok) {
        setSuccessMessage(t('pages.auth.changePassword.resetSuccess'));
        setTimeout(() => router.push('/signin'), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('pages.auth.changePassword.resetFailed'));
      }
    } catch {
      setError(t('pages.auth.changePassword.resetError'));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-4"
      >
        <div className="text-center space-y-1 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('pages.auth.changePassword.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('pages.auth.changePassword.description')}
          </p>
        </div>

        {error && (
          <div className="text-center space-y-6">
            <Alert variant="destructive">
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
            <Button asChild>
              <Link href="/signin" className="text-primary">
                {t('pages.auth.changePassword.goBackToLogin')}
              </Link>
            </Button>
          </div>
        )}

        {successMessage && (
          <Alert>
            <AlertIcon>
              <Check />
            </AlertIcon>
            <AlertTitle>{successMessage}</AlertTitle>
          </Alert>
        )}

        {verifyingToken && (
          <Alert>
            <AlertIcon>
              <LoaderCircleIcon className="size-4 animate-spin" />
            </AlertIcon>
            <AlertTitle>{t('pages.auth.changePassword.verifying')}</AlertTitle>
          </Alert>
        )}

        {isValidToken && !successMessage && !verifyingToken && (
          <>
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.auth.changePassword.newPassword')}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={passwordVisible ? 'text' : 'password'}
                        placeholder={t('pages.auth.changePassword.newPasswordPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      mode="icon"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute end-0 top-1/2 -translate-y-1/2 h-7 w-7 me-1.5 bg-transparent!"
                      aria-label={
                        passwordVisible
                          ? t('pages.auth.changePassword.hidePassword')
                          : t('pages.auth.changePassword.showPassword')
                      }
                    >
                      {passwordVisible ? (
                        <EyeOff className="text-muted-foreground" />
                      ) : (
                        <Eye className="text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.auth.changePassword.confirmNewPassword')}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={passwordConfirmationVisible ? 'text' : 'password'}
                        placeholder={t('pages.auth.changePassword.confirmNewPasswordPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      mode="icon"
                      onClick={() =>
                        setPasswordConfirmationVisible(
                          !passwordConfirmationVisible,
                        )
                      }
                      className="absolute end-0 top-1/2 -translate-y-1/2 h-7 w-7 me-1.5 bg-transparent!"
                      aria-label={
                        passwordConfirmationVisible
                          ? t('pages.auth.changePassword.hidePasswordConfirmation')
                          : t('pages.auth.changePassword.showPasswordConfirmation')
                      }
                    >
                      {passwordConfirmationVisible ? (
                        <EyeOff className="text-muted-foreground" />
                      ) : (
                        <Eye className="text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isProcessing} className="w-full">
              {isProcessing && <LoaderCircleIcon className="size-4 animate-spin" />}
              {t('pages.auth.changePassword.submit')}
            </Button>
          </>
        )}
      </form>
    </Form>
  );
}
