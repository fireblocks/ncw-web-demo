import { GoogleAuthProvider } from "firebase/auth";

/** View and manage its own configuration data in your Google Drive. */
const DRIVE_APPDATA = "https://www.googleapis.com/auth/drive.appdata";
/** View and manage the files in your Google Drive. */
const DRIVE = "https://www.googleapis.com/auth/drive";
/** View and manage Google Drive files and folders that you have opened or created with this app. */
const DRIVE_FILE = "https://www.googleapis.com/auth/drive.file";

export const GoogleDriveProvider = new GoogleAuthProvider();
GoogleDriveProvider.addScope(DRIVE);
GoogleDriveProvider.addScope(DRIVE_APPDATA);
GoogleDriveProvider.addScope(DRIVE_FILE);

export const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

export function getUserGoogleDriveProvider(user: string) {
    const provider = new GoogleAuthProvider();
    provider.addScope(DRIVE);
    provider.addScope(DRIVE_APPDATA);
    provider.addScope(DRIVE_FILE);
    provider.setCustomParameters({"login_hint": user});
    return provider;
}