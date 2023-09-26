import React from "react";

import { GenerateMPCKeys } from "./GenerateMPCKeys";
import { Takeover } from "./Takeover";
import { BackupAndRecover } from "./BackupAndRecover";
import { Assets } from "./Assets";
import { Transactions } from "./Transactions";
import { Web3 } from "./Web3";
import { useAppStore } from "../AppStore";

export const FireblockNCWExampleActions: React.FC = () => {
  const { keysStatus } = useAppStore();
  const secP256K1Status = keysStatus?.MPC_CMP_ECDSA_SECP256K1?.keyStatus ?? null;
  const ed25519Status = keysStatus?.MPC_EDDSA_ED25519?.keyStatus ?? null;

  const hasAKey = secP256K1Status === "READY" || ed25519Status === "READY";
  return (
    <>
      <GenerateMPCKeys />
      <BackupAndRecover />
      {hasAKey && (
        <>
          <Assets />
          <Transactions />
          <Web3 />
          <Takeover />
        </>
      )}
    </>
  );
};
