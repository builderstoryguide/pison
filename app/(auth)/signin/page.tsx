'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiErrorWarningFill } from '@remixicon/react';
import { AlertCircle, Eye, EyeOff, LoaderCircleIcon } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/hooks/useTranslation';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SIGNIN_IDENTIFIER_LABEL } from '../constants';
import { getSigninSchema, SigninSchemaType } from '../forms/signin-schema';

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showDevCredentials =
    process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_DEV_CREDENTIALS === '1';

  const devCredentials = showDevCredentials
    ? [
      { label: 'Manager', email: 'admin@dcm.local', password: 'admin123' },
      { label: 'Accountant', email: 'accountant@dcm.local', password: 'accountant123' },
      { label: 'Agent', email: 'agent1@dcm.local', password: 'agent123' },
    ]
    : [];

  const form = useForm<SigninSchemaType>({
    resolver: zodResolver(getSigninSchema()),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: false,
    },
  });

  async function onSubmit(values: SigninSchemaType) {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await signIn('credentials', {
        redirect: false,
        identifier: values.identifier,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      if (response?.error) {
        const errorData = JSON.parse(response.error);
        setError(errorData.message);
        setIsProcessing(false);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('pages.auth.signin.unexpectedError'),
      );
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center">
      {!isMounted ? (
        <LoaderCircleIcon className="size-8 animate-spin text-muted-foreground" />
      ) : (
        <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
        noValidate
      >
        <div className="space-y-1.5 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            {t('pages.auth.signin.title')}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {t('pages.auth.signin.subtitle')}
          </p>
        </div>

        {showDevCredentials && devCredentials.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <RiErrorWarningFill className="size-3.5 text-primary" />
              {t('pages.auth.signin.devCredentials')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {devCredentials.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                  onClick={() => {
                    form.setValue('identifier', cred.email, { shouldDirty: true });
                    form.setValue('password', cred.password, { shouldDirty: true });
                  }}
                >
                  {cred.label}
                  <span className="text-muted-foreground font-normal">
                    {cred.email} / {cred.password}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('pages.auth.signin.identifier', SIGNIN_IDENTIFIER_LABEL)}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="username"
                  placeholder={t('pages.auth.signin.identifierPlaceholder', 'Your email or username')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center gap-2.5">
                <FormLabel>{t('pages.auth.signin.password')}</FormLabel>
                <Link
                  href="/reset-password"
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  {t('pages.auth.signin.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  placeholder={t('pages.auth.signin.passwordPlaceholder')}
                  type={passwordVisible ? 'text' : 'password'}
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  size="sm"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute end-0 top-1/2 -translate-y-1/2 h-7 w-7 me-1.5 bg-transparent!"
                  aria-label={
                    passwordVisible
                      ? t('pages.auth.signin.hidePassword')
                      : t('pages.auth.signin.showPassword')
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

        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <>
                <Checkbox
                  id="remember-me"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm leading-none text-muted-foreground"
                >
                  {t('pages.auth.signin.rememberMe')}
                </label>
              </>
            )}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            type="submit"
            size="lg"
            disabled={isProcessing}
            aria-busy={isProcessing}
            className="min-w-[120px]"
          >
            {isProcessing && (
              <LoaderCircleIcon className="size-4 shrink-0 me-2 animate-spin" aria-hidden />
            )}
            {isProcessing ? t('pages.auth.signin.signingIn') : t('pages.auth.signin.signIn')}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {t('pages.auth.signin.contactManager')}
        </p>
      </form>
    </Form>
      )}
    </div>
  );
}
