import React from "react";

import { useAppStore } from "../AppStore";
import { AssignDevice } from "./AssignDevice";
import { FireblocksNCWInitializer } from "./FireblocksNCWInitializer";
import { LoginToDemoAppServer } from "./LoginToDemoAppServer";
import { useAuth0AccessToken } from "../auth/auth0AccessTokenHook";
import { FireblockCosignerSDKActions } from "./FireblockCosignerSDKActions";

export const AppContent: React.FC = () => {
  const token = useAuth0AccessToken();

  const {
    loginToDemoAppServerStatus,
    assignDeviceStatus,
    appStoreInitialized,
    fireblocksNCWStatus: fireblocksNCWStatus,
    initAppStore,
    disposeAppStore,
  } = useAppStore((appStore) => ({
    assignDeviceStatus: appStore.assignDeviceStatus,
    loginToDemoAppServerStatus: appStore.loginToDemoAppServerStatus,
    appStoreInitialized: appStore.appStoreInitialized,
    fireblocksNCWStatus: appStore.fireblocksNCWStatus,
    initAppStore: appStore.initAppStore,
    disposeAppStore: appStore.disposeAppStore,
  }));

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
              {fireblocksNCWStatus === "sdk_available" && <FireblockCosignerSDKActions />}
            </>
          )}
        </>
      )}
    </>
  );
};
