import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, AuthProvider, GoogleAuthProvider, OAuthProvider, User, getAuth, signInWithPopup } from "firebase/auth";
import { IAuthManager, IUser } from "./IAuthManager";
import { getUserGoogleDriveProvider } from "./providers";

const firebaseConfig = {
  apiKey: "AIzaSyA2E5vK3fhxvftpfS02T8eIC3SrXnIUjrs",
  authDomain: "fireblocks-sdk-demo.firebaseapp.com",
  projectId: "fireblocks-sdk-demo",
  storageBucket: "fireblocks-sdk-demo.appspot.com",
  messagingSenderId: "127498444203",
  appId: "1:127498444203:web:31ff24e7a4c6bfa92e46ee",
};
// PROD_US
const firebaseConfig_prodUS = {
  apiKey: "AIzaSyDJbJXv2XhihYdiWNk9VWse9ZeymcJdt1U",
  authDomain: "fireblocks-ncw-demo.firebaseapp.com",
  projectId: "fireblocks-ncw-demo",
  storageBucket: "fireblocks-ncw-demo.appspot.com",
  messagingSenderId: "1010855653011",
  appId: "1:1010855653011:web:0a366e1d16933f9b092766",
  measurementId: "G-C0LGRNQEZQ",
};

export class FirebaseAuthManager implements IAuthManager {
  private readonly _auth: Auth;
  private _loggedUser: User | null = null;

  constructor() {
    const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
    // const firebaseApp: FirebaseApp = initializeApp(firebaseConfig_prodUS);
    this._auth = getAuth(firebaseApp);
    this._loggedUser = this._auth.currentUser;
    this._auth.onAuthStateChanged((user) => {
      this._loggedUser = user;
    });
  }

  public async getGoogleDriveCredentials() {
    const provider = getUserGoogleDriveProvider(this._auth.currentUser!.email!);
    const result = await signInWithPopup(this._auth, provider);
    // TODO: persist credential from original firebase login
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (!token) {
      throw new Error("Failed to retrieve token");
    }
    return token;
  }

  public async login(provider: "GOOGLE" | "APPLE"): Promise<void> {
    let authProvider: AuthProvider;
    switch (provider) {
      case "GOOGLE":
        const googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: "select_account" });
        authProvider = googleProvider;
        break;
      case "APPLE":
        authProvider = new OAuthProvider("apple.com");
        break;
      default:
        throw new Error("Unsupported provider");
    }

    const unsubscribe = this._auth.onAuthStateChanged((user) => {
      this._loggedUser = user;
      unsubscribe();
    });

    const result = await signInWithPopup(this._auth, authProvider);
    this._loggedUser = result.user;
  }

  public logout(): Promise<void> {
    return this._auth.signOut();
  }

  public getAccessToken(): Promise<string> {
    if (!this._loggedUser) {
      throw new Error("User is not logged in");
    }

    return this._loggedUser.getIdToken();
  }

  public get loggedUser(): IUser | null {
    return this._loggedUser;
  }

  public onUserChanged(callback: (user: IUser | null) => void): () => void {
    return this._auth.onAuthStateChanged(callback);
  }
}
