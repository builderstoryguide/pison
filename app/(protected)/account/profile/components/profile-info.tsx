'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks/useTranslation';

export const ProfileInfo = () => {
    const { data: session } = useSession();
    const { t } = useTranslation();

    if (!session?.user) {
        return null;
    }

    const { user } = session;

    // Helper to get initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const displayedStatus = user.status ?? 'Active';

    return (
        <Card className="min-w-full">
            <CardHeader>
                <CardTitle>{t('profile.personalInfo') || 'Personal Info'}</CardTitle>
            </CardHeader>
            <CardContent className="kt-scrollable-x-auto pb-3 p-0">
                <Table className="align-middle text-sm text-muted-foreground">
                    <TableBody>
                        <TableRow>
                            <TableCell className="py-2 min-w-28 text-secondary-foreground font-normal">
                                {t('profile.photo') || 'Photo'}
                            </TableCell>
                            <TableCell className="py-2 text-gray700 font-normal min-w-32 text-sm">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.avatar || ''} alt={user.name ?? ''} />
                                    <AvatarFallback>{getInitials(user.name ?? user.email ?? '')}</AvatarFallback>
                                </Avatar>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="py-2 text-secondary-foreground font-normal">
                                {t('profile.name') || 'Name'}
                            </TableCell>
                            <TableCell className="py-2 text-foreground font-semibold text-sm">
                                {user.name}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="py-2 text-secondary-foreground font-normal">
                                {t('profile.email') || 'Email'}
                            </TableCell>
                            <TableCell className="py-2 text-foreground font-normal text-sm">
                                {user.email}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="py-2 text-secondary-foreground font-normal">
                                {t('profile.role') || 'Role'}
                            </TableCell>
                            <TableCell className="py-2 text-foreground font-normal text-sm">
                                <Badge variant="outline">{user.roleName || 'User'}</Badge>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="py-3 text-secondary-foreground font-normal">
                                {t('profile.status') || 'Status'}
                            </TableCell>
                            <TableCell className="py-3 text-foreground font-normal">
                                <Badge variant={displayedStatus === 'active' ? 'default' : 'secondary'}>
                                    {displayedStatus}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
