import React from 'react';
import { useCrew, ProfileWithRoles } from '@/hooks/useCrew';
import { Enums } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = Enums<'app_role'>;

const ROLES_ORDER: Role[] = [
  'President',
  'Vice-President',
  'Honorary Secretary',
  'Honorary Assistant Secretary',
  'Honorary Treasurer',
  'Honorary Assistant Treasurer',
  'Training Head (General)',
  'Training Head (Land)',
  'Training Head (Water)',
  'Training Head (Welfare)',
  'Quartermaster',
  'Assistant Quarter Master',
  'Publicity Head',
  'First Assistant Publicity Head',
  'Second Assistant Publicity Head',
  'Member'
];

const EventInvite = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const { data: crew, isLoading, error, refetch } = useCrew();
  const { toast } = useToast();
  const [invited, setInvited] = React.useState<string[]>([]);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);

  const handleInvite = (memberId: string, memberName: string) => {
    // This would be an API call in a real app
    setInvited(prev => [...prev, memberId]);
    toast({
      title: "✅ Operator Invited",
      description: `${memberName} has been invited to the programme.`,
    });
  };

  const membersByRole = React.useMemo(() => {
    if (!crew) return {};
    const grouped: Record<string, ProfileWithRoles[]> = {};
    ROLES_ORDER.forEach(r => grouped[r] = []);

    crew.forEach(member => {
      member.user_roles.forEach(roleInfo => {
        if (grouped[roleInfo.role]) {
          grouped[roleInfo.role].push(member);
        }
      });
    });
    return grouped;
  }, [crew]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="flex flex-wrap justify-center gap-2">
            {[...Array(15)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-md" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="mb-2">Error Loading Crew</h3>
        <p className="text-muted-foreground mb-4">Could not fetch crew members. Please try again later.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invite Operators</h1>
          <p className="text-muted-foreground">Select operators to invite to the programme.</p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/events/${eventId}`}>
            <ArrowLeft />
            Back to Programme
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a Role</CardTitle>
          <p className="text-muted-foreground">Choose a role from the dropdown to see available operators.</p>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedRole || ''}
            onValueChange={(value) => {
              setSelectedRole(value ? value as Role : null);
            }}
          >
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES_ORDER.map(role =>
                (membersByRole[role] && membersByRole[role].length > 0) ? (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ) : null
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Operators for {selectedRole}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(membersByRole[selectedRole] || []).map(member => (
                <div key={member.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.avatar_url || undefined} alt={member.full_name || 'User'} />
                      <AvatarFallback>{member.full_name?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInvite(member.id, member.full_name || 'Operator')}
                      disabled={invited.includes(member.id)}
                    >
                      {invited.includes(member.id) && <Check />}
                      {invited.includes(member.id) ? 'Invited' : 'Invite'}
                    </Button>
                </div>
              ))}
              {(membersByRole[selectedRole] || []).length === 0 && (
                <p className="text-muted-foreground col-span-full text-center">No operators found for this role.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventInvite;
