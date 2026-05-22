
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import RequireNonMemberStaff from "@/components/auth/RequireNonMemberStaff";
import GearForm from "@/components/gear/GearForm";

const GearNew = () => {
  return (
    <MainLayout>
      <RequireNonMemberStaff>
        <GearForm />
      </RequireNonMemberStaff>
    </MainLayout>
  );
};

export default GearNew;
