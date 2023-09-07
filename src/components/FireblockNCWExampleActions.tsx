import React from "react";

import { GenerateMPCKeys } from "./GenerateMPCKeys";
import { Takeover } from "./Takeover";
import { BackupAndRecover } from "./BackupAndRecover";
import { Accounts } from "./Accounts";
import { Transactions } from "./Transactions";
import { Web3 } from "./Web3";

export const FireblockNCWExampleActions: React.FC = () => {
  return (
    <>
      <GenerateMPCKeys />
      <Takeover />
      <BackupAndRecover />
      <Accounts />
      <Transactions />
      <Web3 />
    </>
  );
};
