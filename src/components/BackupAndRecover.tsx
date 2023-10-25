import React from "react";

import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";

export const BackupAndRecover: React.FC = () => {
  const [err, setErr] = React.useState<string | null>(null);
  const [backupCompleted, setBackupCompleted] = React.useState(false);
  const [recoverCompleted, setRecoverCompleted] = React.useState(false);
  const [isBackupInProgress, setIsBackupInProgress] = React.useState(false);
  const [isRecoverInProgress, setIsRecoverInProgress] = React.useState(false);
  const { keysStatus, passphrase, regeneratePassphrase, setPassphrase, backupKeys, recoverKeys } =
    useAppStore();

  const doBackupKeys = async () => {
    setErr(null);
    setIsBackupInProgress(true);
    setBackupCompleted(false);
    setRecoverCompleted(false);
    try {
      await backupKeys();
      setBackupCompleted(true);
      setIsBackupInProgress(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErr(err.message);
      } else {
        setErr("Unknown Error");
      }
    } finally {
      setIsBackupInProgress(false);
    }
  };

  const doRecoverKeys = async () => {
    setErr(null);
    setIsRecoverInProgress(true);
    setRecoverCompleted(false);
    setBackupCompleted(false);
    try {
      await recoverKeys();
      setRecoverCompleted(true);
      setIsRecoverInProgress(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErr(err.message);
      } else {
        setErr("Unknown Error");
      }
    } finally {
      setIsRecoverInProgress(false);
    }
  };

  const secP256K1Status = keysStatus?.MPC_CMP_ECDSA_SECP256K1?.keyStatus ?? null;
  const ed25519Status = keysStatus?.MPC_EDDSA_ED25519?.keyStatus ?? null;

  const hasReadyAlgo = secP256K1Status === "READY" || ed25519Status === "READY";

  const backupAction: ICardAction = {
    label: "Backup keys",
    action: doBackupKeys,
    isDisabled: isBackupInProgress || passphrase === null || passphrase.trim() === "" || hasReadyAlgo === false,
    isInProgress: isBackupInProgress,
  };

  const recoverAction: ICardAction = {
    label: "Recover keys",
    action: doRecoverKeys,
    isDisabled: isRecoverInProgress || passphrase === null || passphrase.trim() === "",
    isInProgress: isRecoverInProgress,
  };

  return (
    <Card title="Backup/Recover" actions={[backupAction, recoverAction]}>
      <div className="grid grid-cols-[150px_auto_50px] gap-2">
        <label className="label">
          <span className="label-text">Passphrase:</span>
        </label>
        <input
          type="text"
          value={passphrase ?? ""}
          className="input input-bordered"
          onChange={(e) => setPassphrase(e.currentTarget.value)}
        />
        <button className="btn btn-secondary" onClick={regeneratePassphrase}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0,0,256,256" width="24px" height="24px" fillRule="nonzero">
            <g fill="#ffffff" fillRule="nonzero" stroke="none" strokeWidth="1">
              <g transform="scale(10.66667,10.66667)">
                <path d="M16,15h8l-4,5zM8,9h-8l4,-5z"></path>
                <path d="M21,6c0,-1.654 -1.346,-3 -3,-3h-10.839l1.6,2h9.239c0.551,0 1,0.448 1,1v10h2zM3,18c0,1.654 1.346,3 3,3h10.839l-1.6,-2h-9.239c-0.551,0 -1,-0.448 -1,-1v-10h-2z"></path>
              </g>
            </g>
          </svg>
        </button>
      </div>
      {backupCompleted && (
        <div className="mockup-code">
          <pre>
            <code>Backup completed successfuly!</code>
          </pre>
        </div>
      )}
      {recoverCompleted && (
        <div className="mockup-code">
          <pre>
            <code>Recover completed successfuly!</code>
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
