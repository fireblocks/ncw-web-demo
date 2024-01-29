import React from "react";

import { TKeyStatus } from "@fireblocks/ncw-js-sdk";
import { useAppStore } from "../AppStore";
import { IActionButtonProps } from "./ui/ActionButton";
import { Card } from "./ui/Card";
import { ENV_CONFIG } from "../env_config";

export const GenerateMPCKeys: React.FC = () => {
  const [err, setErr] = React.useState<string | null>(null);
  const [isGenerateInProgress, setIsGenerateInProgress] = React.useState(false);
  const [isStopInProgress, setIsStopInProgress] = React.useState(false);
  const [generateMPCKeysResult, setGenerateMPCKeysResult] = React.useState<string | null>(null);
  const { keysStatus, generateMPCKeys, stopMpcDeviceSetup, approveJoinWallet, stopJoinExistingWallet } = useAppStore();

  const doGenerateMPCKeys = async () => {
    setGenerateMPCKeysResult(null);
    setErr(null);
    setIsGenerateInProgress(true);
    try {
      await generateMPCKeys();
      setGenerateMPCKeysResult("Success");
      setIsGenerateInProgress(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErr(err.message);
      } else {
        if (typeof err === "string") {
          setErr(err);
        } else {
          setErr("Unknown Error");
        }
      }
    } finally {
      setIsGenerateInProgress(false);
    }
  };

  const doStopMPCDeviceSetup = async () => {
    setErr(null);
    setIsStopInProgress(true);
    try {
      await stopMpcDeviceSetup();
      setIsStopInProgress(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErr(err.message);
      } else {
        setErr("Unknown Error");
      }
    } finally {
      setIsStopInProgress(false);
    }
  };

  const secP256K1Status = keysStatus?.MPC_CMP_ECDSA_SECP256K1?.keyStatus ?? null;
  const ed25519Status = keysStatus?.MPC_CMP_EDDSA_ED25519?.keyStatus ?? null;
  const statusToProgress = (status: TKeyStatus | null) => {
    switch (status) {
      case "INITIATED":
        return 7;
      case "REQUESTED_SETUP":
        return 32;
      case "SETUP":
        return 53;
      case "SETUP_COMPLETE":
        return 72;
      case "READY":
        return 100;
      default:
        return 0;
    }
  };
  const secP256K1Ready = secP256K1Status === "READY";
  const ed25519Ready = ed25519Status === "READY";

  const generateAction: IActionButtonProps = {
    label: "Generate MPC Keys",
    action: doGenerateMPCKeys,
    isDisabled: isGenerateInProgress || (secP256K1Ready && ed25519Ready),
    isInProgress: isGenerateInProgress,
  };

  const stopAction: IActionButtonProps = {
    label: "Stop MPC Device Setup",
    action: doStopMPCDeviceSetup,
    isDisabled: isStopInProgress || !isGenerateInProgress,
    isInProgress: isStopInProgress,
  };

  const approveJoinWalletAction: IActionButtonProps = {
    label: "Approve Joining Wallet",
    action: approveJoinWallet,
    isDisabled: (isStopInProgress || isGenerateInProgress) && (ed25519Ready || secP256K1Ready),
  };
  const stopApproveWalletAction: IActionButtonProps = {
    label: "Stop Join Process",
    action: stopJoinExistingWallet,
  };

  const actions = [generateAction, stopAction, approveJoinWalletAction];
  if (ENV_CONFIG.DEV_MODE) {
    actions.push(stopApproveWalletAction);
  }

  return (
    <Card title="Generate MPC Keys" actions={actions}>
      <div className="overflow-x-auto">
        <table className="table">
          {/* head */}
          <thead>
            <tr>
              <th>Algorithm</th>
              <th>INITIATED</th>
              <th>REQUESTED_SETUP</th>
              <th>SETUP</th>
              <th>SETUP_COMPLETE</th>
              <th>READY</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>
                <span className="label-text">ECDSA SECP256K1</span>
              </th>
              <td colSpan={5}>
                <progress
                  className="progress progress-primary"
                  value={statusToProgress(secP256K1Status)}
                  max="100"
                ></progress>
              </td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <th>
                <span className="label-text">EDDSA ED25519</span>
              </th>
              <td colSpan={5}>
                <progress
                  className="progress progress-primary"
                  value={statusToProgress(ed25519Status)}
                  max="100"
                ></progress>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {generateMPCKeysResult && (
        <div className="mockup-code">
          <pre>
            <code>Result: {generateMPCKeysResult}</code>
          </pre>
        </div>
      )}
      {err && (
        <div className="alert alert-error shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{err}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
