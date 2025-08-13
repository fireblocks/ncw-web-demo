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

  // Fixed authentication effect with cleanup and abort handling
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const setupAuth = async (ck: CloudKit) => {
      const MAX_RETRIES = 3;
      const MAX_DELAY = 8000; // Cap at 8 seconds
      let attempt = 0;
      let delay = 1000; // Start with 1 second

      while (isMounted && attempt < MAX_RETRIES) {
        attempt++;
        try {
          const appleId = await ck.getDefaultContainer().setUpAuth();

          // Check if component is still mounted before state update
          if (!isMounted) return;

          if (appleId) {
            setAppleSignedIn(true);
            return; // Success
          }

          // If appleId is null but no error, it's a valid state (user not signed in)
          setAppleSignedIn(false);
          return;
        } catch (error: any) {
          // Check if component is still mounted before continuing
          if (!isMounted) return;

          const isRetryableError = error?.status === 421 || error?.ckErrorCode === "UNKNOWN_ERROR";
          const isLastAttempt = attempt >= MAX_RETRIES;

          console.warn(`CloudKit auth attempt ${attempt}/${MAX_RETRIES} failed:`, error);

          if (isRetryableError && !isLastAttempt) {
            console.log(`Retrying CloudKit auth in ${delay}ms due to transient error...`);

            // Use a cancellable timeout
            await new Promise<void>((resolve) => {
              timeoutId = setTimeout(() => {
                timeoutId = null;
                resolve();
              }, delay);
            });

            // Check again after timeout completes
            if (!isMounted) return;

            delay = Math.min(delay * 2, MAX_DELAY); // Exponential backoff with cap
          } else {
            // Either non-retryable error or last attempt failed
            setAppleSignedIn(false);
            throw error;
          }
        }
      }
    };

    if (cloudkit) {
      setupAuth(cloudkit).catch((err) => {
        // Only log if component is still mounted
        if (isMounted) {
          console.error("CloudKit authentication setup failed:", err);
        }
      });
    }

    // Cleanup function - prevents memory leaks and race conditions
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
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

  return { cloudkit, appleSignedIn, setAppleSignedIn };
}
