
import React from "react";
import Header from "./Header";
import MobileTabBar from "./MobileTabBar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <main className="flex-grow container mx-auto w-full px-4 py-4 pb-24 sm:py-6 lg:pb-6">
        {children}
      </main>
      <footer className="bg-black text-white py-4 hidden lg:block">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} TPAC OS. All rights reserved.</p>
        </div>
      </footer>
      <MobileTabBar />
    </div>
  );
};

export default MainLayout;
