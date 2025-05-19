
import React from "react";
import AuthForm from "@/components/auth/AuthForm";

const Auth = () => {
  return (
    <div className="min-h-screen bg-tan-light flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-forest">TPAC OS</h1>
        <p className="text-forest-dark mt-2">Discover and organize Singapore's outdoor adventures</p>
      </div>
      
      <div className="w-full max-w-md">
        <AuthForm />
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} TPAC OS. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Auth;
