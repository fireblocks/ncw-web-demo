import React from "react";

import { TKeyStatus } from "@fireblocks/ncw-js-sdk";
import { useAppStore } from "../AppStore";
import { IActionButtonProps } from "./ui/ActionButton";
import { Card } from "./ui/Card";
import { Copyable } from "./ui/Copyable";

export const JoinExistingWallet: React.FC = () => {
  const [err, setErr] = React.useState<string | null>(null);
  const [isJoinInProgress, setIsJoinInProgress] = React.useState(false);
  const [joinExistingWalletResult, setJoinExistingWalletResult] = React.useState<string | null>(null);
  const { keysStatus, joinExistingWallet, addDeviceRequestId } = useAppStore();

  const doJoinExistingWallet = async () => {
    setJoinExistingWalletResult(null);
    setErr(null);
    setIsJoinInProgress(true);
    try {
      await joinExistingWallet();
      setJoinExistingWalletResult("Success");
      setIsJoinInProgress(false);
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
      setIsJoinInProgress(false);
    }
  };

  const secP256K1Status = keysStatus?.MPC_CMP_ECDSA_SECP256K1?.keyStatus ?? null;
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

  const generateAction: IActionButtonProps = {
    label: "Join",
    action: doJoinExistingWallet,
    isDisabled: false,
    isInProgress: isJoinInProgress,
  };

  return (
    <Card title="Join Existing Wallet" actions={[generateAction]}>
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
        </table>
      </div>
      {joinExistingWalletResult && (
        <div className="mockup-code">
          <pre>
            <code>Result: {joinExistingWalletResult}</code>
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
      {addDeviceRequestId && (
        <div className="my-4">
          <span className="label-text">Request ID to approve: </span>
          <Copyable value={addDeviceRequestId} />
        </div>
      )}
    </Card>
  );
};
