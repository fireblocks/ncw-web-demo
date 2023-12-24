import { DISCOVERY_DOC } from "../auth/providers";

export const gdriveRecover = (token: string, passphraseId: string) => {
  return new Promise<string>((resolve, reject) => {
    gapi.load("client", {
      callback: async () => {
        try {
          const filename = `passphrase_${passphraseId}.txt`;
          await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });

          const list = await gapi.client.drive.files.list({
            spaces: "appDataFolder",
            oauth_token: token,
            q: `name='${filename}'`,
          });

          const file = list.result.files?.find((f) => f.name === filename);
          if (file?.id) {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const content = await res.text();
            return resolve(content);
          } else {
            throw new Error("not found");
          }
        } catch (e) {
          reject(e);
        }
      },
      onerror: reject,
      ontimeout: reject,
      timeout: 5_000,
    });
  });
};

export const gdriveBackup = (token: string, passphrase: string, passphraseId: string) => {
  return new Promise<void>((resolve, reject) => {
    gapi.load("client", {
      callback: async () => {
        try {
          await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });

          const filename = `passphrase_${passphraseId}.txt`;

          const file = new Blob([passphrase], { type: "text/plain" });
          const metadata: gapi.client.drive.File = {
            name: filename,
            mimeType: "text/plain",
            parents: ["appDataFolder"],
          };

          const create = await gapi.client.drive.files.create({
            oauth_token: token,
            uploadType: "media",
            resource: metadata,
            fields: "id",
          });

          const res = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${create.result.id}?uploadType=media`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": metadata.mimeType!,
                "Content-Length": file.size.toString(),
              },
              body: passphrase,
            },
          );

          resolve();
        } catch (e) {
          reject(e);
        }
      },
      onerror: reject,
      ontimeout: reject,
      timeout: 5_000,
    });
  });
};
