
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
import { AlertCircle, Users, FileText, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Enums } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

const CrewList = () => {
  const { data: crew, isLoading, isError, error } = useCrew();

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const roleColor = (role: Enums<'app_role'>) => {
    switch (role) {
      case 'President':
        return 'bg-red-500 text-white hover:bg-red-600 border-transparent';
      case 'Vice-President':
        return 'bg-orange-500 text-white hover:bg-orange-600 border-transparent';
      case 'Honorary Secretary':
      case 'Honorary Assistant Secretary':
        return 'bg-yellow-500 text-black hover:bg-yellow-600 border-transparent';
      case 'Honorary Treasurer':
      case 'Honorary Assistant Treasurer':
        return 'bg-green-500 text-white hover:bg-green-600 border-transparent';
      case 'Training Head (General)':
      case 'Training Head (Land)':
      case 'Training Head (Water)':
      case 'Training Head (Welfare)':
        return 'bg-blue-500 text-white hover:bg-blue-600 border-transparent';
      case 'Quartermaster':
      case 'Assistant Quarter Master':
        return 'bg-indigo-500 text-white hover:bg-indigo-600 border-transparent';
      case 'Publicity Head':
      case 'First Assistant Publicity Head':
      case 'Second Assistant Publicity Head':
        return 'bg-purple-500 text-white hover:bg-purple-600 border-transparent';
      case 'Member':
        return 'bg-gray-400 text-white hover:bg-gray-500 border-transparent';
      default:
        return 'bg-gray-400 text-white hover:bg-gray-500 border-transparent';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Crew</h1>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Crew</h1>
          <p className="text-muted-foreground">Manage crew members, roles, and related assets.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/feedback">
              <FileText className="mr-2 h-4 w-4" />
              File AAR
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/gear">
              <Package className="mr-2 h-4 w-4" />
              Inventory
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Organizational Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ROLES_ORDER.map((role) => (
              <Badge key={role} className={roleColor(role)}>
                {role}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

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
                        <Badge key={index} className={roleColor(roleItem.role)}>
                          {roleItem.role}
                        </Badge>
                      )) : <Badge className={roleColor('Member')}>Member</Badge>}
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
