export interface IUser {
  displayName: string | null;
  email: string | null;
}

export interface IAuthManager {
  getGoogleDriveCredentials(): Promise<string>;
  login(provider: "GOOGLE" | "APPLE"): Promise<void>;
  logout(): Promise<void>;
  getAccessToken(): Promise<string>;
  onUserChanged(callback: (user: IUser | null) => void): () => void;
  get loggedUser(): IUser | null;
}
