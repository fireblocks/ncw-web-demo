import React from "react";

import { GenerateMPCKeys } from "./GenerateMPCKeys";
import { Takeover } from "./Takeover";
import { BackupAndRecover } from "./BackupAndRecover";
import { Assets } from "./Assets";
import { Transactions } from "./Transactions";
import { Web3 } from "./Web3";
import { useAppStore } from "../AppStore";
import { JoinExistingWallet } from "./JoinExistingWallet";
import { Logs } from "./Logs";

export const FireblocksNCWExampleActions: React.FC = () => {
  const { keysStatus, joinExistingWalletMode } = useAppStore();
  const secP256K1Status = keysStatus?.MPC_CMP_ECDSA_SECP256K1?.keyStatus ?? null;
  const ed25519Status = keysStatus?.MPC_CMP_EDDSA_ED25519?.keyStatus ?? null;

  const hasAKey = secP256K1Status === "READY" || ed25519Status === "READY";

  return (
    <>
      {/* {joinExistingWalletMode ? <JoinExistingWallet /> : <GenerateMPCKeys />} */}
      <GenerateMPCKeys />
      <JoinExistingWallet />
      <BackupAndRecover />
      {hasAKey && (
        <>
          <Assets />
          <Transactions />
          <Web3 />
          <Takeover />
          <Logs />
        </>
      )}
    </>
  );
};
