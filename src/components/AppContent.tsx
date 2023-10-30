import React from "react";

import { useAppStore } from "../AppStore";
import { AssignDevice } from "./AssignDevice";
import { FireblocksNCWInitializer } from "./FireblocksNCWInitializer";
import { LoginToDemoAppServer } from "./LoginToDemoAppServer";
import { FireblockNCWExampleActions } from "./FireblockNCWExampleActions";

export const AppContent: React.FC = () => {
  const {
    loginToDemoAppServerStatus,
    assignDeviceStatus,
    appStoreInitialized,
    fireblocksNCWStatus,
    initAppStore,
    disposeAppStore,
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
