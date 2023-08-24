import React from "react";

import { BackupAndRecover } from "./BackupAndRecover";
import { GenerateMPCKeys } from "./GenerateMPCKeys";
import { Takeover } from "./Takeover";
import { Transactions } from "./Transactions";
import { Accounts } from "./Accounts";
import { useAppStore } from "../AppStore";

export const FireblockNCWExampleActions: React.FC = () => {
  const { keysStatus } = useAppStore();

  const isKeysGenerated = keysStatus && Object.keys(keysStatus).some((algo) => keysStatus[algo].keyStatus === "READY");
  return (
    <>
      <GenerateMPCKeys />
      {isKeysGenerated && (
        <>
          <Accounts />
          <Takeover />
          <BackupAndRecover />
          <Transactions />
        </>
      )}
    </>
  );
};
