import { Auth0Provider } from "@auth0/auth0-react";
import React from "react";
import { Auth0Login } from "./auth/Auth0Login";
import { auth0ProviderConfig } from "./auth/auth0ProviderConfig";
import { AppContent } from "./components/AppContent";
import { NavBar } from "./components/ui/NavBar";

export const App: React.FC = () => {
  return (
    <Auth0Provider {...auth0ProviderConfig}>
      <div className="flex flex-col gap-4 pt-4 bg-gray-200 h-screen overflow-hidden">
        <NavBar />
        <div className="p-4 flex-1 overflow-auto bg-gray-400">
          <div className="flex flex-col gap-4 m-auto max-w-[970px]">
            <Auth0Login>
              <AppContent />
            </Auth0Login>
          </div>
        </div>
      </div>
    </Auth0Provider>
  );
};
