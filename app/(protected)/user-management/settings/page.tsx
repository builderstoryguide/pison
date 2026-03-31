'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ControllerRenderProps, FieldErrors, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { I18N_LANGUAGES } from '@/i18n/config';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoaderCircleIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from './components/settings-context';
import TimezoneSelect from './components/timezone-select';
import {
  GeneralSettingsSchema,
  GeneralSettingsSchemaType,
} from './forms/general-settings-schema';

export default function Page() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const [logoExistingPreview, setLogoExistingPreview] = useState<string | null>(
    '',
  );
  const [logoAttachedPreview, setLogoAttachedPreview] = useState<string | null>(
    '',
  );
  const logoFileRef = useRef<HTMLInputElement | null>(null);

  // Ensure all fields have default values
  const transformedSettings: GeneralSettingsSchemaType = {
    ...settings,
    logoFile: null,
    logoAction: '',
    name: settings?.name || '',
    active: settings?.active || true,
    address: settings?.address || '',
    websiteURL: settings?.websiteURL || '',
    language: settings?.language || 'en',
    supportEmail: settings?.supportEmail || '',
    supportPhone: settings?.supportPhone || '',
    currency: settings?.currency || 'USD',
    currencyFormat: settings?.currencyFormat || '$ {value}',
    timezone: settings?.timezone || 'Europe/London',
    defaultDailyClosureTime: settings?.defaultDailyClosureTime || '18:00',
  };

  useEffect(() => {
    if (settings?.logo) {
      // Assume settings.logo contains the URL of the saved logo
      setLogoExistingPreview(settings.logo);
      setLogoAttachedPreview(null);
    }
  }, [settings]);

  const form = useForm<GeneralSettingsSchemaType>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: transformedSettings,
    mode: 'onSubmit',
  });

  const mutation = useMutation({
    mutationFn: async (values: GeneralSettingsSchemaType) => {
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (key === 'logoFile' && values.logoFile instanceof File) {
          formData.append('logoFile', values.logoFile);
        } else if (key !== 'logoFile') {
          formData.append(
            key,
            values[key as keyof GeneralSettingsSchemaType] as string,
          );
        }
      });

      const response = await apiFetch('/api/user-management/settings/general', {
        method: 'POST',
        body: formData,
      });

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
            <AlertTitle>{t('pages.settings.updateSuccess')}</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );

      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['session-status'] });
    },
    onError: (error: Error) => {
      toast.custom(
        (t) => (
          <Alert
            variant="mono"
            icon="destructive"
            close={true}
            onClose={() => {
              toast.dismiss(t);
            }}
          >
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

  const handleRemoveLogo = () => {
    setLogoExistingPreview(null);
    form.trigger('logoFile');
    form.setValue('logoFile', null);
    form.setValue('logoAction', 'remove', { shouldDirty: true });
  };

  const handleCancelLogo = () => {
    setLogoAttachedPreview(null);
    if (settings?.logo) {
      setLogoExistingPreview(settings.logo);
    }
    form.setValue('logoFile', null);
    form.setValue('logoAction', '', { shouldDirty: true });
  };

  const handleChangeLogo = (
    e: ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<GeneralSettingsSchemaType, 'logoFile'>,
  ) => {
    const file = e.target.files?.[0] || null;
    field.onChange(file);
    form.trigger('logoFile');
    form.setValue('logoFile', file);
    form.setValue('logoAction', 'save', { shouldDirty: true });

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoAttachedPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoAttachedPreview(null);
    }
  };

  const handleFormReset = () => {
    form.reset(transformedSettings);
  };

  const handleSubmit = (values: GeneralSettingsSchemaType) => {
    mutation.mutate(values);
  };

  const handleError = (errors: FieldErrors<GeneralSettingsSchemaType>) => {
    // Cast keys as an array of keys of GeneralSettingsSchemaType
    const keys = Object.keys(errors) as (keyof GeneralSettingsSchemaType)[];
    const firstErrorKey = keys[0];
    const firstErrorMessage = errors[firstErrorKey]?.message;

    if (firstErrorMessage) {
      toast.custom(
        (t) => (
          <Alert
            variant="mono"
            icon="destructive"
            close={true}
            onClose={() => {
              toast.dismiss(t);
            }}
          >
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>
              {t('pages.settings.formErrors')}
            </AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>{t('pages.settings.title')}</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, handleError)}
            className="space-y-6 lg:max-w-[600px] mx-auto"
          >
            {/* Logo */}
            <FormField
              control={form.control}
              name="logoFile"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-5">
                    <div className="relative size-32 border rounded-lg overflow-hidden">
                      <img
                        src={
                          logoAttachedPreview ||
                          logoExistingPreview ||
                          '/media/ui/empty-image.svg'
                        }
                        alt={t('pages.settings.logoPreviewAlt')}
                        className="object-cover size-full"
                      />
                    </div>
                    <div>
                      <FormLabel>{t('pages.settings.companyLogo')}</FormLabel>
                      <FormControl className="my-1.5">
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => logoFileRef.current?.click()}
                            >
                              {t('pages.settings.attachImage')}
                            </Button>

                            {logoAttachedPreview ||
                            (!logoAttachedPreview &&
                              !logoExistingPreview &&
                              settings?.logo) ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancelLogo}
                              >
                                {t('common.buttons.cancel')}
                              </Button>
                            ) : null}

                            {settings?.logo &&
                            logoExistingPreview &&
                            !logoAttachedPreview ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleRemoveLogo}
                              >
                                {t('common.buttons.remove')}
                              </Button>
                            ) : null}
                          </div>
                          <input
                            ref={logoFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleChangeLogo(e, field)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {t('pages.settings.logoDescription')}
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* Company Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.shopName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('pages.settings.enterCompanyName')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.shopStatus')}</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2 rounded-lg bg-accent/60 p-4">
                      <Switch
                        id="active"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="active">
                        {t('pages.settings.shopStatusDescription')}
                      </Label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.labels.address')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      id="address"
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder={t('pages.settings.enterStoreAddress')}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('pages.settings.addressDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Language */}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.topbar.userMenu.language')}</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('pages.settings.selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {I18N_LANGUAGES.map((language) => (
                            <SelectItem
                              key={language.code}
                              value={language.code}
                            >
                              <span className="flex w-full items-center justify-between gap-2.5">
                                <img
                                  src={language.flag}
                                  alt={`${language.name} flag`}
                                  className="size-4 rounded-full"
                                />
                                <span className="grow">{language.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              control={form.control}
              name="websiteURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.websiteUrl')}</FormLabel>
                  <FormControl>
                    <Input
                      id="websiteURL"
                      type="url"
                      placeholder={t('pages.settings.enterWebsiteUrl')}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Support Email */}
            <FormField
              control={form.control}
              name="supportEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.supportEmail')}</FormLabel>
                  <FormControl>
                    <Input
                      id="supportEmail"
                      type="email"
                      placeholder={t('pages.settings.enterSupportEmail')}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Support Phone */}
            <FormField
              control={form.control}
              name="supportPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.supportPhone')}</FormLabel>
                  <FormControl>
                    <Input
                      id="supportPhone"
                      type="tel"
                      placeholder={t('pages.settings.enterSupportPhone')}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.currency')}</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('pages.settings.selectCurrency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">
                            GBP - British Pound
                          </SelectItem>
                          <SelectItem value="JPY">
                            JPY - Japanese Yen
                          </SelectItem>
                          <SelectItem value="INR">
                            INR - Indian Rupee
                          </SelectItem>
                          {/* Add more currencies as needed */}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    {t('pages.settings.currencyDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency Format */}
            <FormField
              control={form.control}
              name="currencyFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.currencyFormat')}</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('pages.settings.selectCurrencyFormat')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="$ {value}">
                            $ {`{value}`}
                          </SelectItem>
                          <SelectItem value="{value} €">
                            {`{value}`} €
                          </SelectItem>
                          <SelectItem value="£ {value}">
                            £ {`{value}`}
                          </SelectItem>
                          <SelectItem value="¥ {value}">
                            ¥ {`{value}`}
                          </SelectItem>
                          <SelectItem value="₹ {value}">
                            ₹ {`{value}`}
                          </SelectItem>
                          {/* Add more formats as needed */}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    {t('pages.settings.currencyFormatDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Timezone */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.timezone')}</FormLabel>
                  <FormControl>
                    <TimezoneSelect
                      defaultValue={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultDailyClosureTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('pages.settings.defaultDailyClosureTime', 'Default daily closure time (HH:mm)')}
                  </FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'pages.settings.defaultDailyClosureTimeDesc',
                      'Used for pre-closure reminders (30, 15, 5 minutes before) with the timezone above.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-2.5 justify-end">
              <Button type="button" variant="outline" onClick={handleFormReset}>
                {t('pages.settings.reset')}
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || isProcessing}
              >
                {isProcessing && <LoaderCircleIcon className="animate-spin" />}
                {t('pages.settings.saveSettings')}
              </Button>
            </div>
          </form>
        </Form>
        </CardContent>
      </Card>
    </div>
  );
}
