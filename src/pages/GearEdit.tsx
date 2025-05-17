
import React from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import GearForm from "@/components/gear/GearForm";

const GearEdit = () => {
  const { id } = useParams();
  
  return (
    <MainLayout>
      <GearForm gearId={id} />
    </MainLayout>
  );
};

export default GearEdit;
