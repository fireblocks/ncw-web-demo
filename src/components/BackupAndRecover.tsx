import React, { useEffect } from "react";

import type { CloudKit } from 'tsl-apple-cloudkit';
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";
import { DISCOVERY_DOC } from "../auth/providers";
import { randomPassPhrase } from "../services/randomPassPhrase";

export const BackupAndRecover: React.FC = () => {
  const [err, setErr] = React.useState<string | null>(null);
  const [backupCompleted, setBackupCompleted] = React.useState(false);
  const [recoverCompleted, setRecoverCompleted] = React.useState(false);
  const [isBackupInProgress, setIsBackupInProgress] = React.useState(false);
  const [isRecoverInProgress, setIsRecoverInProgress] = React.useState(false);
  const [cloudkit, setCloudkit] = React.useState<CloudKit | null>(null);
  const [appleSignedIn, setAppleSignedIn] = React.useState<boolean | null>(null);
  const { keysStatus, passphrase, getGoogleDriveCredentials, regeneratePassphrase, setPassphrase, backupKeys, recoverKeys, deviceId } =
    useAppStore();

  useEffect(() => {
    const loadApple = () => {
      const ck = window.CloudKit.configure({
        containers: [{
          containerIdentifier: 'iCloud.com.fireblocks.ncw.demo',
          apiTokenAuth: {
            apiToken: "572a0b5cfcb8992031640d1a14fd0ac3bb7c774cc929a0e23cb00af415da51cd",
            persist: true,
            signInButton: { id: 'sign-in-button', theme: 'black' },
            signOutButton: { id: 'sign-out-button', theme: 'black' }
          },
          environment: 'development',
        }]
      });

      setCloudkit(ck);
    };

    loadApple();
  }, []);

  useEffect(() => {
    const setupAuth = async (ck: CloudKit) => {
      const appleId = await ck.getDefaultContainer().setUpAuth();
      if (appleId) {
        setAppleSignedIn(true);
      } else {
        setAppleSignedIn(false);
      }
    }

    if (cloudkit) {
      setupAuth(cloudkit);
    }
  }, [cloudkit])

  useEffect(() => {
    const onUserChange = async (ck: CloudKit) => {
      if (appleSignedIn) {
        await ck.getDefaultContainer().whenUserSignsOut();
        setAppleSignedIn(false);
      } else {
        await ck.getDefaultContainer().whenUserSignsIn();
        setAppleSignedIn(true);
      }
    }

    if (cloudkit) {
      onUserChange(cloudkit);
    }
  }, [appleSignedIn])

  const backupApple = async (passphrase: string, passphraseId: string) => {
    const db = cloudkit!.getDefaultContainer().privateCloudDatabase;
    const recordName = `backup_t_${passphraseId}`;
    const recordType = "Backup";
   
    // create
    await db.saveRecords([{
      recordName,
      recordType,
      fields: {
        "phrase": {
          type: "STRING",
          value: passphrase,
        }
      }
    }]);
  };

  const recoverApple = async (passphraseId: string) => {
    const db = cloudkit!.getDefaultContainer().privateCloudDatabase;
    const recordName = `backup_t_${passphraseId}`;
    const recordType = "Backup";

    const results = await db.fetchRecords([{
      recordName,
      recordType
    }]);

    if (results.records.length === 1) {
      if (Array.isArray(results.records[0].fields)) {
        throw new Error("Unexpected schema");
      }
      if (results.records[0].fields["phrase"].type !== "STRING") {
        throw new Error("Unexpected schema");
      }
      return results.records[0].fields["phrase"].value as string;
    }

    throw new Error("not found");
  }

  const recoverGdrive = async (passphraseId: string) => {
    const token = await getGoogleDriveCredentials();

    return new Promise<string>((resolve, reject) => {
      gapi.load("client", {
        callback: async () => {
          try {

            const filename = `passphrase_${passphraseId}.txt`;
            await gapi.client.init({
              discoveryDocs: [DISCOVERY_DOC]
            });

            const list = await gapi.client.drive.files.list({
              spaces: "appDataFolder",
              oauth_token: token,
              q: `name='${filename}'`
            });

            console.log("list!", list.result);
            const file = list.result.files?.find(f => f.name === filename);

            if (file?.id) {
              console.log("found", file);
              const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: {
                  "Authorization": `Bearer ${token}`,
                },
              });

              console.log("download response", res);

              const content = await res.text();
              console.log("downloaded passphrase backup", content);
              return resolve(content);
            } else {
              console.log("no backup found");
              throw new Error("not found")
            }
          } catch (e) {
            reject(e);
          }
        }, onerror: reject, ontimeout: reject, timeout: 5_000,
      })
    })
  }

  const backupGdrive = async (passphrase: string, passphraseId: string) => {
    const token = await getGoogleDriveCredentials();

    return new Promise<void>((resolve, reject) => {
      gapi.load("client", {
        callback: async () => {
          try {
            await gapi.client.init({
              discoveryDocs: [DISCOVERY_DOC]
            });

            const filename = `passphrase_${passphraseId}.txt`;

            const file = new Blob([passphrase], { type: "text/plain" });
            const metadata: gapi.client.drive.File = {
              name: filename,
              mimeType: "text/plain",
              parents: ['appDataFolder'],
            };

            const create = await gapi.client.drive.files.create({
              oauth_token: token,
              uploadType: "media",
              resource: metadata,
              fields: "id",
            });

            console.log("create:", create.result);
            console.log("uploading...");

            const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${create.result.id}?uploadType=media`, {
              method: "PATCH",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": metadata.mimeType!,
                "Content-Length": file.size.toString(),
              },
              body: passphrase,
            });

            console.log("upload:", res);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, onerror: reject, ontimeout: reject, timeout: 5_000,
      });
    })
  }

  const doBackupKeys = async (passphrasePersist: (passphrase: string, passphraseId: string) => Promise<void>) => {
    setErr(null);
    setIsBackupInProgress(true);
    setBackupCompleted(false);
    setRecoverCompleted(false);
    try {
      const passphrase = randomPassPhrase();
      const passphraseId = crypto.randomUUID();
      await passphrasePersist(passphrase, passphraseId);
      await backupKeys(passphrase, passphraseId);
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
  const ed25519Status = keysStatus?.MPC_EDDSA_ED25519?.keyStatus ?? null;

  const hasReadyAlgo = secP256K1Status === "READY" || ed25519Status === "READY";

  const googleBackupAction: ICardAction = {
    label: "Google Backup",
    action: () => doBackupKeys(backupGdrive),
    isDisabled: isRecoverInProgress || isBackupInProgress || hasReadyAlgo === false,
    isInProgress: isBackupInProgress,
  };

  const googleReoverAction: ICardAction = {
    label: "Google Recover",
    action: () => doRecoverKeys(recoverGdrive),
    isDisabled: isRecoverInProgress || isBackupInProgress,
    isInProgress: isRecoverInProgress,
  };

  const appleBackupAction: ICardAction = {
    label: "Backup Apple",
    action: () => doBackupKeys(backupApple),
    isDisabled: !appleSignedIn || isRecoverInProgress || isBackupInProgress || hasReadyAlgo === false,
    isInProgress: isBackupInProgress,
  };

  const appleRecoverAction: ICardAction = {
    label: "Apple Recover",
    action: () => doRecoverKeys(recoverApple),
    isDisabled: !appleSignedIn || isRecoverInProgress || isBackupInProgress,
    isInProgress: isRecoverInProgress,
  };

  // const backupAction: ICardAction = {
  //   label: "Backup keys",
  //   action: () => doBackupKeys(async () => (passphrase!)),
  //   isDisabled: isBackupInProgress || passphrase === null || passphrase.trim() === "" || hasReadyAlgo === false,
  //   isInProgress: isBackupInProgress,
  // };

  // const recoverAction: ICardAction = {
  //   label: "Recover keys",
  //   action: () => doRecoverKeys(async () => (passphrase!)),
  //   isDisabled: isRecoverInProgress || passphrase === null || passphrase.trim() === "",
  //   isInProgress: isRecoverInProgress,
  // };

  return (
    <Card title="Backup/Recover" actions={[/*backupAction, recoverAction,*/ googleBackupAction, googleReoverAction, appleBackupAction, appleRecoverAction]}>
      <div id="sign-in-button"></div>
      <div id="sign-out-button"></div>
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
