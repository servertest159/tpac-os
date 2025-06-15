import React from 'react';
import { useCrew, ProfileWithRoles } from '@/hooks/useCrew';
import { Enums } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, ChevronsUpDown, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

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
  'Second Assistant Publicity Head'
];

const EventInvite = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const { data: crew, isLoading, error, refetch } = useCrew();
  const { toast } = useToast();
  const [invited, setInvited] = React.useState<string[]>([]);
  const [inviting, setInviting] = React.useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = React.useState<Role[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!eventId) return;

    const fetchInvites = async () => {
      const { data, error } = await supabase
        .from('event_invitations')
        .select('user_id')
        .eq('event_id', eventId);
      
      if (error) {
        console.error("Error fetching invites", error);
        toast({
          title: "❌ Failed to load existing invitations",
          variant: "destructive"
        });
      } else {
        setInvited(data.map(invite => invite.user_id));
      }
    };

    fetchInvites();
  }, [eventId, toast]);

  const handleInvite = async (memberName: string, memberId: string) => {
    if (!eventId) return;
    setInviting(memberId);

    const { error } = await supabase
      .from('event_invitations')
      .insert({ event_id: eventId, user_id: memberId, status: 'pending' });

    if (error) {
      console.error("Error inviting user", error);
      toast({
        title: "❌ Invitation Failed",
        description: error.code === '23505' ? 'This operator has already been invited.' : error.message,
        variant: "destructive",
      });
    } else {
      setInvited(prev => [...prev, memberId]);
      toast({
        title: "✅ Operator Invited",
        description: `${memberName} has been invited to the programme.`,
      });
    }
    setInviting(null);
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

  const selectedMembers = React.useMemo(() => {
    if (!crew || selectedRoles.length === 0) return [];

    const members = new Map<string, ProfileWithRoles>();
    
    selectedRoles.forEach(role => {
      (membersByRole[role] || []).forEach(member => {
        if (!members.has(member.id)) {
          members.set(member.id, member);
        }
      });
    });

    return Array.from(members.values());
  }, [crew, selectedRoles, membersByRole]);


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
          <CardTitle>Select Roles</CardTitle>
          <p className="text-muted-foreground">Choose one or more roles to see available operators.</p>
        </CardHeader>
        <CardContent>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full md:w-[280px] justify-between"
              >
                <span className="truncate">
                  {selectedRoles.length === 0 && "Select roles..."}
                  {selectedRoles.length === 1 && selectedRoles[0]}
                  {selectedRoles.length > 1 && `${selectedRoles.length} roles selected`}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full md:w-[280px] p-0">
              <Command>
                <CommandInput placeholder="Search roles..." />
                <CommandList>
                  <CommandEmpty>No role found.</CommandEmpty>
                  <CommandGroup>
                    {ROLES_ORDER.map((role) => (
                      <CommandItem
                        key={role}
                        value={role}
                        onSelect={() => {
                          if (selectedRoles.includes(role)) {
                            setSelectedRoles(selectedRoles.filter((r) => r !== role));
                          } else {
                            setSelectedRoles([...selectedRoles, role]);
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedRoles.includes(role) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {role}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="flex flex-wrap gap-1 pt-2">
            {selectedRoles.map(role => (
              <Badge key={role} variant="secondary" className="gap-1">
                {role}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={() => setSelectedRoles(selectedRoles.filter((r) => r !== role))}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {selectedRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Operators ({selectedMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedMembers.map(member => (
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
                      onClick={() => handleInvite(member.full_name || 'Operator', member.id)}
                      disabled={invited.includes(member.id) || inviting === member.id}
                    >
                      {inviting === member.id ? (
                        'Inviting...'
                      ) : invited.includes(member.id) ? (
                        <>
                          <Check />
                          Invited
                        </>
                      ) : (
                        'Invite'
                      )}
                    </Button>
                </div>
              ))}
              {selectedMembers.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center">No operators found for the selected roles.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventInvite;
