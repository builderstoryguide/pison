'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiErrorWarningFill } from '@remixicon/react';
import { AlertCircle, Eye, EyeOff, LoaderCircleIcon } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
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
import { getSigninSchema, SigninSchemaType } from '../forms/signin-schema';

export default function Page() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev credentials are only initialized in development to keep them out of prod bundles
  const devCredentials =
    process.env.NODE_ENV === 'development'
      ? [
          { label: 'Manager', email: 'admin@dcm.local', password: 'admin123' },
          { label: 'Accountant', email: 'accountant@dcm.local', password: 'accountant123' },
          { label: 'Agent', email: 'agent1@dcm.local', password: 'agent123' },
        ]
      : [];

  const form = useForm<SigninSchemaType>({
    resolver: zodResolver(getSigninSchema()),
    defaultValues: {
      email: '',
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
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      if (response?.error) {
        const errorData = JSON.parse(response.error);
        setError(errorData.message);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
      >
        <div className="space-y-1.5 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            Sign in to DCMS
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Daily Collection Management System
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && devCredentials.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <RiErrorWarningFill className="size-3.5 text-primary" />
              Dev credentials (click to fill):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {devCredentials.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                  onClick={() => {
                    form.setValue('email', cred.email, { shouldDirty: true });
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Your email" {...field} />
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
                <FormLabel>Password</FormLabel>
                <Link
                  href="/reset-password"
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  placeholder="Your password"
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
                    passwordVisible ? 'Hide password' : 'Show password'
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
                  Remember me
                </label>
              </>
            )}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
            Sign In
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Contact your manager if you need an account.
        </p>
      </form>
    </Form>
  );
}
