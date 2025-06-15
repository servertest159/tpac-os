
import React from "react";
import { useCrew } from "@/hooks/useCrew";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CrewList = () => {
  const { data: crew, isLoading, isError, error } = useCrew();

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'President':
        return 'default';
      case 'Vice President':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Crew</h1>
          <p className="text-muted-foreground">Manage your crew members.</p>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[250px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[250px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load crew members. {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Crew</h1>
        <p className="text-muted-foreground">Manage your crew members.</p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crew && crew.length > 0 ? (
              crew.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={member.avatar_url ?? undefined} alt={member.full_name ?? ''} />
                      <AvatarFallback>
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{member.full_name || 'N/A'}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.user_roles.length > 0 ? member.user_roles.map((roleItem, index) => (
                        <Badge key={index} variant={roleColor(roleItem.role)}>
                          {roleItem.role}
                        </Badge>
                      )) : <Badge variant="outline">Member</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No crew members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       {crew && crew.length === 0 && (
         <div className="text-center py-12 border-2 border-dashed rounded-lg">
           <Users className="mx-auto h-12 w-12 text-muted-foreground" />
           <h3 className="mt-4 mb-2">No Crew Members Yet</h3>
           <p className="text-muted-foreground mb-4 max-w-md mx-auto">
             Sign up new users to see them appear here. You can then assign them roles.
           </p>
         </div>
       )}
    </div>
  );
};

export default CrewList;
