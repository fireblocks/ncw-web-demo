import React from "react";

import { BackupAndRecover } from "./BackupAndRecover";
import { GenerateMPCKeys } from "./GenerateMPCKeys";
import { Takeover } from "./Takeover";
import { Transactions } from "./Transactions";

export const FireblockNCWExampleActions: React.FC = () => {
  return (
    <>
      <GenerateMPCKeys />
      <Takeover />
      <Transactions />
      <BackupAndRecover />
    </>
  );
};
