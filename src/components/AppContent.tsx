import React from "react";

import { useAppStore } from "../AppStore";
import { AssignDevice } from "./AssignDevice";
import { FireblocksNCWInitializer } from "./FireblocksNCWInitializer";
import { LoginToDemoAppServer } from "./LoginToDemoAppServer";
import { FireblocksNCWExampleActions } from "./FireblocksNCWExampleActions";
import { ModeSelector } from "./ModeSelector";

export const AppContent: React.FC = () => {
  const {
    loginToDemoAppServerStatus,
    assignDeviceStatus,
    appStoreInitialized,
    fireblocksNCWStatus,
    initAppStore,
    disposeAppStore,
    appMode,
    walletId,
  } = useAppStore();

  React.useEffect(() => {
    if (appStoreInitialized) {
      return () => {
        disposeAppStore();
      };
    } else {
      initAppStore();
    }
  }, [disposeAppStore, appStoreInitialized]);

  if (!appStoreInitialized) {
    return null;
  }

  return (
    <>
      <LoginToDemoAppServer />
      {loginToDemoAppServerStatus === "success" && (
        <>
          <ModeSelector />
          {appMode && (
            <>
              <FireblocksNCWInitializer />
              {fireblocksNCWStatus === "sdk_available" && <AssignDevice />}

              {walletId && <FireblocksNCWExampleActions />}
            </>
          )}
        </>
      )}
    </>
  );
};
