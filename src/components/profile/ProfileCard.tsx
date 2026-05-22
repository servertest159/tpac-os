
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TPAC_SESSION_EVENT, MEMBER_ROLE_LABEL } from "@/lib/auth";
import StaffRosterCard from "./StaffRosterCard";

const ProfileCard = () => {
  const [userRole, setUserRole] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("tpac_user_role") : null
  );

  useEffect(() => {
    const read = () => setUserRole(localStorage.getItem("tpac_user_role"));
    read();
    window.addEventListener(TPAC_SESSION_EVENT, read);
    return () => window.removeEventListener(TPAC_SESSION_EVENT, read);
  }, []);

  const staffManage = !!userRole && userRole !== MEMBER_ROLE_LABEL;

  const getInitials = (role: string | null) => {
    if (!role) return "?";
    const words = role.split(' ');
    if (words.length > 1) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return role.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1>Profile</h1>
        <p className="text-muted-foreground">Your currently assumed role and roster visibility.</p>
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
            <p className="text-muted-foreground">You are currently operating with the permissions of the <Badge variant="secondary">{userRole}</Badge> role.</p>
            <p className="text-muted-foreground pt-4 text-xs">This profile is based on the access code you entered. To change roles, please log out and enter a different access code.</p>
          </div>
        </CardContent>
      </Card>
      {staffManage && <StaffRosterCard />}
    </div>
  );
};

export default ProfileCard;
