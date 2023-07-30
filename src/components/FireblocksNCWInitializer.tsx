import React from "react";

import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";

export const FireblocksNCWInitializer: React.FC = () => {
  const {
    fireblocksNCW,
    automateInitialization,
    fireblocksNCWStatus,
    initFireblocksNCW,
    disposeFireblocksNCW,
  } = useAppStore();

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
      ];
      break;
  }

  return (
    <Card title="Fireblocks SDK" actions={sdkActions}>
      {fireblocksNCWStatus === "sdk_initialization_failed" && "Initialization Failed"}
    </Card>
  );
};
