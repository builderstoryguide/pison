'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Users, MapPin, Wallet, Phone, Mail, Home, Calendar, Shield } from 'lucide-react';
import { formatDate } from '@/lib/helpers';

interface ClientDetailsProps {
  clientId: string;
}

export default function ClientDetails({ clientId }: ClientDetailsProps) {
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const response = await apiFetch(`/api/clients/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      const result = await response.json();
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!client) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Client not found
        </CardContent>
      </Card>
    );
  }

  const balance = client.account ? parseFloat(client.account.balance) : 0;
  const statusColors: Record<string, 'success' | 'secondary' | 'destructive' | 'warning'> = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
    SUSPENDED: 'warning',
    CLOSED: 'destructive',
  };

  return (
    <div className="grid gap-6">
      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Client Information</CardTitle>
            <Badge variant={statusColors[client.status] || 'secondary'}>
              {client.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Full Name</div>
                  <div className="font-medium">{client.fullName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Client Number</div>
                  <div className="font-medium">{client.clientNumber}</div>
                </div>
              </div>

              {client.nationalId && (
                <div className="flex items-start gap-3">
                  <Shield className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">National ID</div>
                    <div className="font-medium">{client.nationalId}</div>
                  </div>
                </div>
              )}

              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{client.phone}</div>
                  </div>
                </div>
              )}

              {client.email && (
                <div className="flex items-start gap-3">
                  <Mail className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{client.email}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {client.address && (
                <div className="flex items-start gap-3">
                  <Home className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-medium">{client.address}</div>
                  </div>
                </div>
              )}

              {client.city && (
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">City</div>
                    <div className="font-medium">{client.city}</div>
                  </div>
                </div>
              )}

              {client.area && (
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Collection Area</div>
                    <div className="font-medium">
                      {client.area.name} ({client.area.code})
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium">
                    {formatDate(new Date(client.createdAt))}
                  </div>
                </div>
              </div>

              {client.isCommissionExempt && (
                <div className="flex items-start gap-3">
                  <Shield className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Badge variant="outline">Commission Exempt</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info Card */}
      {client.account && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Wallet className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Account Number</div>
                  <div className="font-medium">{client.account.accountNumber}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Wallet className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Balance</div>
                  <div className="font-medium text-lg">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0,
                    }).format(balance)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
