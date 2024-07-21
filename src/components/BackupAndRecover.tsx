import React, { useEffect } from "react";

import { useAppStore } from "../AppStore";
import { IActionButtonProps } from "./ui/ActionButton";
import { Card, ICardAction } from "./ui/Card";
import { randomPassPhrase } from "../services/randomPassPhrase";
import { TPassphraseLocation } from "../services/ApiService";
import { gdriveBackup, gdriveRecover } from "../services/GoogleDrive";
import { cloudkitBackup, cloudkitRecover } from "../services/Cloudkit";
import { useCloudkit } from "./Cloudkit";
import { handleError } from "./utils/error-utils";

export const BackupAndRecover: React.FC = () => {
  const [err, setErr] = React.useState<string | null>(null);
  const [backupCompleted, setBackupCompleted] = React.useState(false);
  const [recoverCompleted, setRecoverCompleted] = React.useState(false);
  const [isBackupInProgress, setIsBackupInProgress] = React.useState(false);
  const [isRecoverInProgress, setIsRecoverInProgress] = React.useState(false);
  const {
    keysStatus,
    getGoogleDriveCredentials,
    backupKeys,
    recoverKeys,
    getPassphraseInfos,
    getLatestBackup,
    createPassphraseInfo,
    latestBackup,
    passphrases,
    walletId,
  } = useAppStore();

  const { cloudkit, appleSignedIn } = useCloudkit();

  useEffect(() => {
    if (!passphrases) {
      getPassphraseInfos();
    }
  }, [passphrases]);

  useEffect(() => {
    if (!latestBackup) {
      getLatestBackup();
    }
  }, [latestBackup, walletId]);

  const recoverGoogleDrive = async (passphraseId: string) => {
    const token = await getGoogleDriveCredentials();
    return gdriveRecover(token, passphraseId);
  };

  const backupGoogleDrive = async (passphrase: string, passphraseId: string) => {
    const token = await getGoogleDriveCredentials();
    return gdriveBackup(token, passphrase, passphraseId);
  };

  const recoverPassphraseId: (passphraseId: string) => Promise<string> = async (passphraseId) => {
    await getPassphraseInfos();

    if (passphrases === null) {
      throw new Error();
    }

    // try to reuse previous
    for (const info of Object.values(passphrases)) {
      if (info.passphraseId === passphraseId) {
        switch (info.location) {
          case "GoogleDrive": {
            return await recoverGoogleDrive(info.passphraseId);
          }
          case "iCloud": {
            if (!cloudkit || !appleSignedIn) {
              throw new Error("Sign in with Apple ID required");
            }

            return await cloudkitRecover(cloudkit, info.passphraseId);
          }
          default:
            throw new Error(`Unsupported backup location ${location}`);
        }
      }
    }

    throw new Error(`Not found backup location ${location} passphraseId ${passphraseId}`);
  };

  const passphraseRecover: (
    location: TPassphraseLocation,
  ) => Promise<{ passphrase: string; passphraseId: string }> = async (location) => {
    if (passphrases === null) {
      throw new Error();
    }

    // try to reuse previous
    for (const info of Object.values(passphrases)) {
      if (info.location === location) {
        switch (location) {
          case "GoogleDrive": {
            const passphrase = await recoverGoogleDrive(info.passphraseId);
            return { passphraseId: info.passphraseId, passphrase };
          }
          case "iCloud": {
            if (!cloudkit || !appleSignedIn) {
              throw new Error("Sign in with Apple ID required");
            }

            const passphrase = await cloudkitRecover(cloudkit, info.passphraseId);
            return { passphraseId: info.passphraseId, passphrase };
          }
          default:
            throw new Error(`Unsupported backup location ${location}`);
        }
      }
    }

    throw new Error(`Not found backup location ${location}`);
  };

  const passphrasePersist: (
    location: TPassphraseLocation,
  ) => Promise<{ passphrase: string; passphraseId: string }> = async (location) => {
    if (passphrases === null) {
      throw new Error();
    }

    // try {
    //   const recover = await passphraseRecover(location);
    //   if (recover) {
    //     return recover;
    //   }
    // } catch (e) {
    //   console.warn(`failed to load previous passphrase, creating new`, e, location);
    // }

    // creating new
    const passphrase = randomPassPhrase();
    const passphraseId = crypto.randomUUID();

    switch (location) {
      case "GoogleDrive": {
        await backupGoogleDrive(passphrase, passphraseId);
        await createPassphraseInfo(passphraseId, location);
        return { passphraseId, passphrase };
      }
      case "iCloud": {
        if (!cloudkit || !appleSignedIn) {
          throw new Error("Apple Sign in required");
        }
        await cloudkitBackup(cloudkit, passphrase, passphraseId);
        await createPassphraseInfo(passphraseId, location);
        return { passphraseId, passphrase };
      }
      default:
        throw new Error(`Unsupported backup location ${location}`);
    }
  };

  const doBackupKeys = async (passphrasePersist: () => Promise<{ passphrase: string; passphraseId: string }>) => {
    setErr(null);
    setIsBackupInProgress(true);
    setBackupCompleted(false);
    setRecoverCompleted(false);
    try {
      const { passphrase, passphraseId } = await passphrasePersist();
      await backupKeys(passphrase, passphraseId);
      setBackupCompleted(true);
      setIsBackupInProgress(false);
    } catch (err: unknown) {
      handleError(err, setErr);
    } finally {
      setIsBackupInProgress(false);
    }
    await getLatestBackup();
  };

  const doRecoverKeys = async (passphraseResolver: (passphraseId: string) => Promise<string>) => {
    setErr(null);
    setIsRecoverInProgress(true);
    setRecoverCompleted(false);
    setBackupCompleted(false);
    try {
      await recoverKeys(passphraseResolver);
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
  const ed25519Status = keysStatus?.MPC_CMP_EDDSA_ED25519?.keyStatus ?? null;
  const hasReadyAlgo = secP256K1Status === "READY" || ed25519Status === "READY";

  const googleBackupAction: ICardAction = {
    label: "Google Drive Backup",
    action: () => doBackupKeys(() => passphrasePersist("GoogleDrive")),
    isDisabled: isRecoverInProgress || isBackupInProgress || hasReadyAlgo === false,
    isInProgress: isBackupInProgress,
  };

  const appleBackupAction: ICardAction = {
    label: "iCloud Backup",
    action: () => doBackupKeys(() => passphrasePersist("iCloud")),
    isDisabled: !appleSignedIn || isRecoverInProgress || isBackupInProgress || hasReadyAlgo === false,
    isInProgress: isBackupInProgress,
  };

  const recoverAction: ICardAction = {
    label: "Recover",
    action: () => doRecoverKeys(recoverPassphraseId),
    isDisabled: !latestBackup || isRecoverInProgress || isBackupInProgress,
    isInProgress: isRecoverInProgress,
  };

  if (passphrases === null) {
    return;
  }
  return (
    <Card title="Backup/Recover" actions={[googleBackupAction, appleBackupAction, recoverAction]}>
      <div id="sign-in-button"></div>
      <div id="sign-out-button"></div>
      {latestBackup && (
        <div>
          <div>Last known backup</div>
          <div>Location: {latestBackup.location}</div>
          <div>Created: {new Date(latestBackup.createdAt).toString()}</div>
        </div>
      )}
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
