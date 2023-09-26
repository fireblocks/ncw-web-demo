import React from "react";

import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";
import { AreYouSureDialog } from "./ui/AreYouSureDialog";

export const FireblocksNCWInitializer: React.FC = () => {
  const {
    fireblocksNCW,
    automateInitialization,
    fireblocksNCWStatus,
    initFireblocksNCW,
    disposeFireblocksNCW,
    clearSDKStorage,
  } = useAppStore();
  const [isAreYouSureDialogOpen, setIsAreYouSureDialogOpen] = React.useState(false);

  const onClearSDKStorageClicked = () => {
    setIsAreYouSureDialogOpen(true);
  };

  const closeAreYouSureDialog = () => {
    setIsAreYouSureDialogOpen(false);
  };

  const onClearSDKStorageApproved = async () => {
    setIsAreYouSureDialogOpen(false);
    clearSDKStorage();
  };

  // An easy way to auto-initialize
  React.useEffect(() => {
    if (automateInitialization) {
      initFireblocksNCW();
    }
  }, [automateInitialization]);

  // Force dispose on unmount
  React.useEffect(() => {
    if (fireblocksNCW) {
      return () => {
        disposeFireblocksNCW();
      };
    }
  }, [fireblocksNCW]);

  let sdkActions: ICardAction[];

  switch (fireblocksNCWStatus) {
    case "sdk_not_ready":
    case "sdk_initialization_failed":
      sdkActions = [
        {
          action: () => initFireblocksNCW(),
          isDisabled: false,
          label: "Initialize",
        },
      ];
      break;

    case "initializing_sdk":
      sdkActions = [
        {
          isDisabled: true,
          isInProgress: true,
          label: "Creating Fireblocks SDK Instance",
        },
      ];
      break;

    case "sdk_available":
      sdkActions = [
        {
          isDisabled: false,
          label: "Dispose",
          action: disposeFireblocksNCW,
          buttonVariant: "accent",
        },
        {
          isDisabled: false,
          label: "Clear Storage",
          action: onClearSDKStorageClicked,
          buttonVariant: "accent",
        },
      ];
      break;
  }

  return (
    <>
      <Card title="Fireblocks SDK" actions={sdkActions}>
        {fireblocksNCWStatus === "sdk_initialization_failed" && "Initialization Failed"}
      </Card>
      <AreYouSureDialog
        title="Are you sure?"
        isOpen={isAreYouSureDialogOpen}
        onYes={onClearSDKStorageApproved}
        onNo={closeAreYouSureDialog}
      >
        <div className="alert alert-error mt-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="flex-1">Warning: All data will be lost!!</span>
        </div>
      </AreYouSureDialog>
    </>
  );
};
