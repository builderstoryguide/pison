'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
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
import { UserRole } from '@/app/models/user';
import { useRoleSelectQuery } from '@/app/(protected)/user-management/roles/hooks/use-role-select-query';
import { AccountantAddSchema, AccountantAddSchemaType } from '@/app/(protected)/accountants/forms/user-add-schema';

type AddUserResponse = {
    message: string;
    generatedPassword?: string;
    user?: {
        id: string;
        name: string;
        email: string;
        username?: string;
        status: string;
    };
};

export default function CreateAccountantForm() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();

    // Fetch available roles
    const { data: roleList } = useRoleSelectQuery();

    const accountantRole = useMemo(() => {
        if (!roleList) return null;
        return roleList.find((role: UserRole) => role.slug === 'accountant');
    }, [roleList]);

    const form = useForm<AccountantAddSchemaType>({
        resolver: zodResolver(AccountantAddSchema),
        defaultValues: {
            name: '',
            email: '',
            roleId: '',
        },
        mode: 'onSubmit',
    });

    useEffect(() => {
        if (accountantRole) {
            form.setValue('roleId', accountantRole.id);
        }
    }, [form, accountantRole]);

    const mutation = useMutation({
        mutationFn: async (values: AccountantAddSchemaType) => {
            const response = await apiFetch('/api/user-management/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: values.name,
                    email: values.email,
                    roleId: values.roleId,
                }),
            });

            if (!response.ok) {
                const { message } = await response.json();
                throw new Error(message);
            }

            return response.json() as Promise<AddUserResponse>;
        },
        onSuccess: (result) => {
            // Download credential file with auto-generated credentials
            const user = result?.user;
            if (user) {
                const username = user.username || user.name;
                const password = result.generatedPassword || '(not available)';
                const content = [
                    'DCMS Accountant Account Credentials',
                    '------------------------------------',
                    `Name: ${user.name}`,
                    `Username: ${username}`,
                    `Email: ${user.email}`,
                    `Password: ${password}`,
                    '',
                    'You can login with either your username or email and your password.',
                    'Important: Change this password after first login.',
                ].join('\n');

                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `accountant-credentials-${username}.txt`;
                link.click();
                URL.revokeObjectURL(url);
            }

            const message = t('common.messages.success');
            toast.custom(
                () => (
                    <Alert variant="mono" icon="success" close={false}>
                        <AlertIcon>
                            <RiCheckboxCircleFill />
                        </AlertIcon>
                        <AlertTitle>{message}</AlertTitle>
                    </Alert>
                ),
                {
                    position: 'top-center',
                },
            );

            queryClient.invalidateQueries({ queryKey: ['accountants'] });
            router.push('/accountants');
        },
        onError: (error: Error) => {
            toast.custom(
                () => (
                    <Alert variant="mono" icon="destructive" close={false}>
                        <AlertIcon>
                            <RiErrorWarningFill />
                        </AlertIcon>
                        <AlertTitle>{error.message}</AlertTitle>
                    </Alert>
                ),
                {
                    position: 'top-center',
                },
            );
        },
    });

    const isProcessing = mutation.status === 'pending';

    const handleSubmit = (values: AccountantAddSchemaType) => {
        if (!accountantRole) {
            toast.error('Accountant role not loaded yet.');
            return;
        }
        mutation.mutate(values);
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{t('menu.addAccountant')}</CardTitle>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('common.labels.name')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('common.placeholders.enterName')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('common.labels.email')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('common.placeholders.enterEmail')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-sm text-muted-foreground">
                            A username and password will be automatically generated. Login credentials will be downloaded as a file after creation.
                        </div>
                        <FormField
                            control={form.control}
                            name="roleId"
                            render={() => (
                                <input type="hidden" {...form.register('roleId')} />
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => router.push('/accountants')}>
                            {t('common.buttons.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={!form.formState.isDirty || isProcessing}
                        >
                            {isProcessing && <LoaderCircleIcon className="animate-spin" />}
                            {t('menu.addAccountant')}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
