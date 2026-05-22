
import React from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import RequireNonMemberStaff from "@/components/auth/RequireNonMemberStaff";
import GearForm from "@/components/gear/GearForm";

const GearEdit = () => {
  const { id } = useParams();
  
  return (
    <MainLayout>
      <RequireNonMemberStaff>
        <GearForm gearId={id} />
      </RequireNonMemberStaff>
    </MainLayout>
  );
};

export default GearEdit;
