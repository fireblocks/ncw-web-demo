import React from "react";
import { useAppStore } from "./AppStore";
import { Login } from "./auth/Login";
import { AppContent } from "./components/AppContent";
import { NavBar } from "./components/ui/NavBar";

export const App: React.FC = () => {
  const { loggedUser } = useAppStore();
  return (
    <div className="flex flex-col gap-4 pt-4 bg-gray-200 h-screen overflow-hidden">
      <NavBar />
      <div className="p-4 flex-1 overflow-auto bg-gray-400">
        <div className="flex flex-col gap-4 m-auto max-w-[970px]">{loggedUser ? <AppContent /> : <Login />}</div>
      </div>
    </div>
  );
};
