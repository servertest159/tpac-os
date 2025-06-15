
import React from "react";
import { Users } from "lucide-react";

const CrewList = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1>Crew</h1>
        <p className="text-muted-foreground">Manage your crew members.</p>
      </div>
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 mb-2">Crew Management Coming Soon</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          This section is under construction. To properly manage and assign crew, I need to update the database to link users to specific programmes.
        </p>
      </div>
    </div>
  );
};

export default CrewList;
