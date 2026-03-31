'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AppWindowMac,
  Bell,
  LoaderCircleIcon,
  MailWarning,
  UserPlus,
  Users,
} from 'lucide-react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSettings } from '../components/settings-context';
import {
  NotificationSettingsSchema,
  NotificationSettingsSchemaType,
} from '../forms/notification-settings-schema';

/**
 * Maps legacy SystemSetting `notify*` columns to DCMS concepts. Prisma field names are unchanged.
 */
const NOTIFICATION_SETTING_ROWS = [
  {
    rowKey: 'balanceThreshold',
    emailField: 'notifyStockEmail',
    webField: 'notifyStockWeb',
    roleIdsField: 'notifyStockRoleIds',
  },
  {
    rowKey: 'pendingTransactions',
    emailField: 'notifyNewOrderEmail',
    webField: 'notifyNewOrderWeb',
    roleIdsField: 'notifyNewOrderRoleIds',
  },
  {
    rowKey: 'transactionStatus',
    emailField: 'notifyOrderStatusUpdateEmail',
    webField: 'notifyOrderStatusUpdateWeb',
    roleIdsField: 'notifyOrderStatusUpdateRoleIds',
  },
  {
    rowKey: 'loanRepayment',
    emailField: 'notifyPaymentFailureEmail',
    webField: 'notifyPaymentFailureWeb',
    roleIdsField: 'notifyPaymentFailureRoleIds',
  },
  {
    rowKey: 'systemAlerts',
    emailField: 'notifySystemErrorFailureEmail',
    webField: 'notifySystemErrorWeb',
    roleIdsField: 'notifySystemErrorRoleIds',
  },
] as const;

function roleIdsFromForm(
  form: UseFormReturn<NotificationSettingsSchemaType>,
  field: keyof NotificationSettingsSchemaType,
): string[] {
  const v = form.watch(field);
  return Array.isArray(v) ? v : [];
}

const NotificationSettingsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { settings, roles } = useSettings();
  const roleList = roles ?? [];

  const form = useForm<NotificationSettingsSchemaType>({
    resolver: zodResolver(NotificationSettingsSchema),
    defaultValues: NOTIFICATION_SETTING_ROWS.reduce<
      Partial<NotificationSettingsSchemaType>
    >(
      (defaults, { emailField, webField, roleIdsField }) => ({
        ...defaults,
        [emailField]:
          Boolean(
            settings?.[
              emailField as keyof NotificationSettingsSchemaType
            ] ?? false,
          ),
        [webField]:
          Boolean(
            settings?.[webField as keyof NotificationSettingsSchemaType] ??
              false,
          ),
        [roleIdsField]: (() => {
          const raw =
            settings?.[
              roleIdsField as keyof NotificationSettingsSchemaType
            ];
          return Array.isArray(raw) ? raw : [];
        })(),
      }),
      {},
    ) as NotificationSettingsSchemaType,
  });

  const mutation = useMutation({
    mutationFn: async (values: NotificationSettingsSchemaType) => {
      const response = await apiFetch(
        '/api/user-management/settings/notifications',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>
              {t('pages.userManagement.settings.notifications.updateSuccess')}
            </AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );

      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (error: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
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

  const handleSubmit = (values: NotificationSettingsSchemaType) => {
    mutation.mutate(values);
  };

  const handleReset = () => {
    form.reset();
  };

  const toggleRoleSelection = (
    field: keyof NotificationSettingsSchemaType,
    roleId: string,
  ) => {
    const current = form.getValues(field);
    const currentValues = Array.isArray(current) ? current : [];
    const updatedValues = currentValues.includes(roleId)
      ? currentValues.filter((id) => id !== roleId)
      : [...currentValues, roleId];

    form.setValue(field, updatedValues, { shouldDirty: true });
  };

  const isProcessing = mutation.status === 'pending';

  const tp = (suffix: string) =>
    `pages.userManagement.settings.notifications.${suffix}`;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>{t(tp('title'))}</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-2.5">
            <Table>
              <TableHeader>
                <TableRow className="text-2sm">
                  <TableHead className="w-[400px] text-muted-foreground ps-6">
                    <div className="inline-flex items-center gap-1.5">
                      <Bell className="text-muted-foreground size-3.5" />
                      {t(tp('columns.notification'))}
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <Users className="text-muted-foreground size-3.5" />
                      {t(tp('columns.roles'))}
                    </div>
                  </TableHead>
                  <TableHead className="w-36 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <MailWarning className="text-muted-foreground size-3.5" />
                      {t(tp('columns.email'))}
                    </div>
                  </TableHead>
                  <TableHead className="w-36 text-center text-muted-foreground pe-6">
                    <div className="inline-flex items-center gap-1.5">
                      <AppWindowMac className="text-muted-foreground size-3.5" />
                      {t(tp('columns.web'))}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {NOTIFICATION_SETTING_ROWS.map(
                  ({
                    rowKey,
                    emailField,
                    webField,
                    roleIdsField,
                  }) => {
                    const rowIds = roleIdsFromForm(
                      form,
                      roleIdsField as keyof NotificationSettingsSchemaType,
                    );
                    return (
                      <TableRow key={rowKey}>
                        <TableCell className="ps-6">
                          <div className="space-y-1">
                            <div className="text-md font-semibold">
                              {t(tp(`rows.${rowKey}.title`))}
                            </div>
                            <div className="text-muted-foreground font-2sm font-regular">
                              {t(tp(`rows.${rowKey}.description`))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  mode="icon"
                                  className="h-7! w-7!"
                                >
                                  <UserPlus className="size-3.5!" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[200px] p-0"
                                align="start"
                                side="bottom"
                              >
                                <Command>
                                  <CommandInput
                                    placeholder={t(
                                      tp('searchRolesPlaceholder'),
                                    )}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {t(tp('noRolesFound'))}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <ScrollArea>
                                        {roleList.map((role) => {
                                          const watched = roleIdsFromForm(
                                            form,
                                            roleIdsField as keyof NotificationSettingsSchemaType,
                                          );
                                          const isSelected = watched.includes(
                                            role.id,
                                          );
                                          return (
                                            <CommandItem
                                              key={role.id}
                                              onSelect={() =>
                                                toggleRoleSelection(
                                                  roleIdsField as keyof NotificationSettingsSchemaType,
                                                  role.id,
                                                )
                                              }
                                            >
                                              <span className="grow">
                                                {role.name}
                                              </span>
                                              {isSelected && <CommandCheck />}
                                            </CommandItem>
                                          );
                                        })}
                                      </ScrollArea>
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <div className="flex items-center flex-wrap gap-2">
                              {rowIds.length > 0 ? (
                                rowIds.map((roleId) => {
                                  const role = roleList.find(
                                    (r) => r.id === roleId,
                                  );
                                  return (
                                    <Badge key={roleId} variant="secondary">
                                      {role?.name}
                                    </Badge>
                                  );
                                })
                              ) : (
                                <span className="text-muted-foreground">
                                  {t(tp('notSet'))}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center pe-2!">
                          <FormField
                            control={form.control}
                            name={
                              emailField as keyof NotificationSettingsSchemaType
                            }
                            render={({ field }) => (
                              <FormItem className="items-center">
                                <FormControl>
                                  <Checkbox
                                    checked={Boolean(field.value)}
                                    onCheckedChange={(v) =>
                                      field.onChange(v === true)
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-center pe-6!">
                          <FormField
                            control={form.control}
                            name={
                              webField as keyof NotificationSettingsSchemaType
                            }
                            render={({ field }) => (
                              <FormItem className="items-center">
                                <FormControl>
                                  <Checkbox
                                    checked={Boolean(field.value)}
                                    onCheckedChange={(v) =>
                                      field.onChange(v === true)
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-end gap-4 py-5 px-10">
            <Button type="button" variant="outline" onClick={handleReset}>
              {t(tp('reset'))}
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing && <LoaderCircleIcon className="animate-spin" />}
              {t(tp('save'))}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default NotificationSettingsPage;
