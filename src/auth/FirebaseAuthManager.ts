import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, AuthProvider, GoogleAuthProvider, OAuthProvider, User, getAuth, signInWithPopup } from "firebase/auth";
import { IAuthManager, IUser } from "./IAuthManager";

const firebaseConfig = {
  apiKey: "AIzaSyA2E5vK3fhxvftpfS02T8eIC3SrXnIUjrs",
  authDomain: "fireblocks-sdk-demo.firebaseapp.com",
  projectId: "fireblocks-sdk-demo",
  storageBucket: "fireblocks-sdk-demo.appspot.com",
  messagingSenderId: "127498444203",
  appId: "1:127498444203:web:31ff24e7a4c6bfa92e46ee",
};

export class FirebaseAuthManager implements IAuthManager {
  private readonly _auth: Auth;
  private _loggedUser: User | null = null;

  constructor() {
    const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
    this._auth = getAuth(firebaseApp);
    this._loggedUser = this._auth.currentUser;
    this._auth.onAuthStateChanged((user) => {
      this._loggedUser = user;
    });
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
