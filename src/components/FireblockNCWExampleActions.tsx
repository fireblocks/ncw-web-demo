import React from "react";

import { BackupAndRecover } from "./BackupAndRecover";
import { GenerateMPCKeys } from "./GenerateMPCKeys";
import { Takeover } from "./Takeover";
import { Transactions } from "./Transactions";
import { Web3 } from "./Web3";

export const FireblockNCWExampleActions: React.FC = () => {
  return (
    <>
      <GenerateMPCKeys />
      <Takeover />
      <BackupAndRecover />
      <Transactions />
      <Web3 />
    </>
  );
};
