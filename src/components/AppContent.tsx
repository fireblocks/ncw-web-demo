import React from "react";

import { useAppStore } from "../AppStore";
import { AssignDevice } from "./AssignDevice";
import { FireblocksNCWInitializer } from "./FireblocksNCWInitializer";
import { LoginToDemoAppServer } from "./LoginToDemoAppServer";
import { useAuth0AccessToken } from "../auth/auth0AccessTokenHook";
import { FireblockNCWExampleActions } from "./FireblockNCWExampleActions";

export const AppContent: React.FC = () => {
  const token = useAuth0AccessToken();

  const {
    loginToDemoAppServerStatus,
    assignDeviceStatus,
    appStoreInitialized,
    fireblocksNCWStatus: fireblocksNCWStatus,
    initAppStore,
    disposeAppStore,
  } = useAppStore();

  React.useEffect(() => {
    if (appStoreInitialized) {
      return () => {
        disposeAppStore();
      };
    }
  }, [disposeAppStore, appStoreInitialized]);

  if (!appStoreInitialized) {
    initAppStore(token);
    return null;
  }

  return (
    <>
      <LoginToDemoAppServer />
      {loginToDemoAppServerStatus === "success" && (
        <>
          <AssignDevice />
          {assignDeviceStatus === "success" && (
            <>
              <FireblocksNCWInitializer />
              {fireblocksNCWStatus === "sdk_available" && <FireblockNCWExampleActions />}
            </>
          )}
        </>
      )}
    </>
  );
};
