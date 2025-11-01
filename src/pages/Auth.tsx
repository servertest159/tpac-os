
import React from "react";
import AuthForm from "@/components/auth/AuthForm";

const Auth = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-primary mb-3">Adventure Planner</h1>
        <p className="text-muted-foreground text-lg">Plan, organize, and track your outdoor adventures</p>
      </div>
      
      <div className="w-full max-w-md">
        <AuthForm />
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Adventure Planner. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Auth;
