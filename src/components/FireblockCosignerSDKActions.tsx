import React from "react";

import { GenerateMPCKeys } from "./GenerateMPCKeys";
import { BackupAndRecover } from "./BackupAndRecover";
import { Transactions } from "./Transactions";

export const FireblockCosignerSDKActions: React.FC = () => {
  return (
    <>
      <GenerateMPCKeys />
      <BackupAndRecover />
      <Transactions />
    </>
  );
};
