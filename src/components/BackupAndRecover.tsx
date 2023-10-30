/// <reference types="../../node_modules/tsl-apple-cloudkit/lib/index.d.ts" />

import React from "react";

import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";
import { useFirebaseApp } from "../auth/firebaseAppHook";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { DISCOVERY_DOC, getUserGoogleDriveProvider } from "../auth/providers";
import type * as CloudKit from 'tsl-apple-cloudkit';
import { randomPassPhrase } from "../services/randomPassPhrase";

window.addEventListener('message', function (e) {
  // console.log('mmm', e.data.ckWebAuthToken);
  // console.log('incoming message', e);
})

export const BackupAndRecover: React.FC = () => {
  const firebaseApp = useFirebaseApp();
  const auth = getAuth(firebaseApp);

  const [err, setErr] = React.useState<string | null>(null);
  const [backupCompleted, setBackupCompleted] = React.useState(false);
  const [recoverCompleted, setRecoverCompleted] = React.useState(false);
  const [isBackupInProgress, setIsBackupInProgress] = React.useState(false);
  const [isRecoverInProgress, setIsRecoverInProgress] = React.useState(false);
  const { keysStatus, passphrase, regeneratePassphrase, setPassphrase, backupKeys, recoverKeys, deviceId } =
    useAppStore();

  const loadApple = async () => {
    // @ts-ignore
    const ck = CloudKit.configure({
      services: {
        logger: console
      },
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

    // TODO: try to use firebase auth credential flow instead if possible
    const appleId = await ck.getDefaultContainer().setUpAuth();
    console.log("appleId", appleId);
    if (!appleId) {
      console.log("waiting...");
      try {
        await ck.getDefaultContainer().whenUserSignsIn();
        console.log("user signed in!");
      } catch (e) {
        console.error("whenUserSignsIn", e);
      }
    }

    // test query
    const r = await ck.getDefaultContainer().privateCloudDatabase.performQuery({ recordType: "String" });
    console.log("query", r);
  }

  const recoverGdrive = async () => {
    const provider = getUserGoogleDriveProvider(auth.currentUser!.email!);
    const result = await signInWithPopup(auth, provider);

    console.log(result);
    // TODO: persist credential from original firebase login
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    return new Promise<string>((resolve, reject) => {
      gapi.load("client", async () => {
        try {

          const filename = `passphrase_${deviceId}.txt`;
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
      })
    })
  }


  const backupGdrive = async () => {
    const provider = getUserGoogleDriveProvider(auth.currentUser!.email!);
    const result = await signInWithPopup(auth, provider);
    // TODO: persist credential from original firebase login
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    return new Promise<string>((res, rej) => {
      gapi.load("client", async () => {
        try {
          await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC]
          });

          const filename = `passphrase_${deviceId}.txt`;
          const list = await gapi.client.drive.files.list({
            spaces: "appDataFolder",
            oauth_token: token,
            q: `name='${filename}'`
          });

          const exists = Boolean(list.result.files?.length);
          console.log("passhrase backup exists", exists);

          const fileContent = randomPassPhrase();
          console.log("xxx", fileContent);

          const file = new Blob([fileContent], { type: "text/plain" });
          const metadata: gapi.client.drive.File = {
            name: filename,
            mimeType: "text/plain",
            parents: ['appDataFolder'],
          };

          if (exists) {
            // update
            console.log("updating...");

            const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${list.result.files![0].id}?uploadType=media`, {
              method: "PATCH",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": metadata.mimeType!,
                "Content-Length": file.size.toString(),
              },
              body: fileContent,
            });

            console.log("upload:", res);
          } else {
            // create 

            console.log("creating...");

            const create = await gapi.client.drive.files.create({
              oauth_token: token,
              uploadType: "media",
              resource: metadata,
              fields: "id",
            });

            console.log("create:", create.result);
            console.log("uploading...");

            const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=media`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": metadata.mimeType!,
                "Content-Length": file.size.toString(),
              },
              body: fileContent,
            });

            console.log("upload:", res);
          }

          res(fileContent);
        } catch (e) {
          rej(e);
        }
      });

      // var saveAppData = function (fileId, appData) {
      //   return gapi.client.request({
      //     path: '/upload/drive/v3/files/' + fileId,
      //     method: 'PATCH',
      //     params: {
      //       uploadType: 'media'
      //     },
      //     body: JSON.stringify(appData)
      //   });
      // };

    })
  }

  const doBackupKeys = async (passphraseResolver: () => Promise<string>) => {
    setErr(null);
    setIsBackupInProgress(true);
    setBackupCompleted(false);
    setRecoverCompleted(false);
    try {
      const passhrase = await passphraseResolver();
      await backupKeys(passhrase);
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

  const doRecoverKeys = async (passphraseResolver: () => Promise<string>) => {
    setErr(null);
    setIsRecoverInProgress(true);
    setRecoverCompleted(false);
    setBackupCompleted(false);
    try {
      const passhrase = await passphraseResolver();
      await recoverKeys(passhrase);
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

  const backupAction: ICardAction = {
    label: "Backup keys",
    action: () => doBackupKeys(async () => (passphrase!)),
    isDisabled: isBackupInProgress || passphrase === null || passphrase.trim() === "" || hasReadyAlgo === false,
    isInProgress: isBackupInProgress,
  };

  const appleAction: ICardAction = {
    label: "Backup Apple",
    // action: doBackupKeys,
    action: loadApple,
    isDisabled: isBackupInProgress || passphrase === null || passphrase.trim() === "" || hasReadyAlgo === false,
    isInProgress: isBackupInProgress,
  };

  const recoverAction: ICardAction = {
    label: "Recover keys",
    action: () => doRecoverKeys(async () => (passphrase!)),
    isDisabled: isRecoverInProgress || passphrase === null || passphrase.trim() === "",
    isInProgress: isRecoverInProgress,
  };

  return (
    <Card title="Backup/Recover" actions={[backupAction, recoverAction, googleBackupAction, googleReoverAction, appleAction]}>
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
