import React, { useEffect } from "react";
import type { CloudKit } from "tsl-apple-cloudkit";
import { ENV_CONFIG } from "../env_config";

export function useCloudkit() {
  const [cloudkit, setCloudkit] = React.useState<CloudKit | null>(null);
  const [appleSignedIn, setAppleSignedIn] = React.useState<boolean | null>(null);

  useEffect(() => {
    let cancel = false;
    const loadApple = () => {
      const ck = window.CloudKit.configure({
        containers: [
          {
            containerIdentifier: ENV_CONFIG.CLOUDKIT_CONTAINER_ID,
            apiTokenAuth: {
              apiToken: ENV_CONFIG.CLOUDKIT_APITOKEN,
              persist: true,
              signInButton: { id: "sign-in-button", theme: "black" },
              signOutButton: { id: "sign-out-button", theme: "black" },
            },
            environment: ENV_CONFIG.CLOUDKIT_ENV ?? "development",
          },
        ],
      });

      if (!cancel) {
        setCloudkit(ck);
      }
    };

    loadApple();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    const setupAuth = async (ck: CloudKit) => {
      const appleId = await ck.getDefaultContainer().setUpAuth();
      if (appleId) {
        setAppleSignedIn(true);
      } else {
        setAppleSignedIn(false);
      }
    };

    if (cloudkit) {
      setupAuth(cloudkit);
    }
  }, [cloudkit]);

  useEffect(() => {
    const onUserChange = async (ck: CloudKit) => {
      if (appleSignedIn) {
        await ck.getDefaultContainer().whenUserSignsOut();
        setAppleSignedIn(false);
      } else {
        await ck.getDefaultContainer().whenUserSignsIn();
        setAppleSignedIn(true);
      }
    };

    if (cloudkit) {
      onUserChange(cloudkit);
    }
  }, [appleSignedIn]);

  return { cloudkit, appleSignedIn };
}
