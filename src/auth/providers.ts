import { GoogleAuthProvider } from "firebase/auth";

/** View and manage its own configuration data in your Google Drive. */
const DRIVE_APPDATA = "https://www.googleapis.com/auth/drive.appdata";

export const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

export function getUserGoogleDriveProvider(user: string) {
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_APPDATA);
  provider.setCustomParameters({ login_hint: user });
  return provider;
}
