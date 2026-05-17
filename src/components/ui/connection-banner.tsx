import React from "react";
import { WifiOff } from "lucide-react";

const ConnectionBanner: React.FC = () => {
  const [online, setOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-sm py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      You're offline. Changes will sync when the connection returns.
    </div>
  );
};

export default ConnectionBanner;
