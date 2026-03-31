import { redirect } from 'next/navigation';

export default function SocialSettingsRedirectPage() {
  redirect('/user-management/settings');
}
