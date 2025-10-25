import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileSkeleton } from "@/components/ui/loading-states";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

const ProfileCard = () => {
  const [userRole, setUserRole] = useState<Enums<'app_role'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        // Fetch user role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (roleError) {
          console.error('Error fetching role:', roleError);
          setError('Failed to load role');
        } else if (roleData) {
          setUserRole(roleData.role);
        } else {
          setUserRole('Member'); // Default role
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const getInitials = (role: string | null) => {
    if (!role) return "?";
    const words = role.split(' ');
    if (words.length > 1) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return role.substring(0, 2).toUpperCase();
  };
  
  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <h1>Profile</h1>
          <p className="text-muted-foreground">Your current role information.</p>
        </div>
        <Card className="w-full max-w-lg mx-auto mt-6">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1>Profile</h1>
        <p className="text-muted-foreground">Your current role within TPAC OS.</p>
      </div>
      <Card className="w-full max-w-lg mx-auto mt-6 animate-scale-in">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-3xl">{getInitials(userRole)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{userRole || 'No Role Assigned'}</CardTitle>
              <CardDescription>Access Level</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Role Details</h3>
            <p className="text-muted-foreground">
              You are currently operating with the permissions of the <Badge variant="secondary">{userRole}</Badge> role.
            </p>
            <p className="text-muted-foreground pt-4 text-xs">
              Your role is assigned by administrators and determines your access level within the system.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCard;
