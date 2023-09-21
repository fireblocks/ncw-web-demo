import React from "react";

import { useAppStore } from "../AppStore";
import { AssignDevice } from "./AssignDevice";
import { FireblocksNCWInitializer } from "./FireblocksNCWInitializer";
import { LoginToDemoAppServer } from "./LoginToDemoAppServer";
import { useAccessTokenGetter } from "../auth/accessTokenGetterHook";
import { FireblockNCWExampleActions } from "./FireblockNCWExampleActions";

export const AppContent: React.FC = () => {
  const tokenGetter = useAccessTokenGetter();

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
    initAppStore(tokenGetter);
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
