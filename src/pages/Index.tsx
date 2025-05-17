
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";

const Index = () => {
  // Check if user is logged in
  const user = localStorage.getItem("user");
  
  // If logged in, redirect to dashboard, otherwise to auth
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />;
};

export default Index;
