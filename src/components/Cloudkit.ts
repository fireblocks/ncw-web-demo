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

      // Enhanced diagnostic logging
      console.log('[CloudKit Debug] Environment:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString(),
        containerConfig: {
          id: ENV_CONFIG.CLOUDKIT_CONTAINER_ID,
          env: ENV_CONFIG.CLOUDKIT_ENV,
        },
        connection: {
          online: navigator.onLine,
          effectiveType: (navigator as any).connection?.effectiveType,
          downlink: (navigator as any).connection?.downlink,
        }
      });

      while (isMounted && attempt < MAX_RETRIES) {
        attempt++;
        console.log(`[CloudKit] Auth attempt ${attempt}/${MAX_RETRIES} starting...`);

        try {
          const appleId = await ck.getDefaultContainer().setUpAuth();

          // Check if component is still mounted before state update
          if (!isMounted) return;

          if (appleId) {
            console.log('[CloudKit] Authentication successful:', { appleId });
            setAppleSignedIn(true);
            return; // Success
          }

          // If appleId is null but no error, it's a valid state (user not signed in)
          console.log('[CloudKit] User not signed in (no appleId returned)');
          setAppleSignedIn(false);
          return;
        } catch (error: any) {
          // Check if component is still mounted before continuing
          if (!isMounted) return;

          const isRetryableError = error?.status === 421 || error?.ckErrorCode === "UNKNOWN_ERROR";
          const isLastAttempt = attempt >= MAX_RETRIES;

          // Enhanced error logging
          console.error('[CloudKit Error] Detailed error information:', {
            attempt: `${attempt}/${MAX_RETRIES}`,
            status: error?.status,
            statusText: error?.statusText,
            ckErrorCode: error?.ckErrorCode,
            message: error?.message,
            isRetryableError,
            isLastAttempt,
            errorObject: JSON.stringify(error, null, 2),
            timestamp: new Date().toISOString(),
          });

          if (isRetryableError && !isLastAttempt) {
            console.log(`[CloudKit] Retrying in ${delay}ms due to transient error (${error?.status || error?.ckErrorCode})...`);

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
            console.error('[CloudKit] Authentication failed permanently:', {
              isRetryableError,
              isLastAttempt,
              finalError: error,
            });
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
