export interface IUser {
  displayName: string | null;
  email: string | null;
}

export interface IAuthManager {
  getGoogleDriveCredentials(): Promise<string>;
  login(provider: "GOOGLE" | "APPLE"): Promise<void>;
  logout(): Promise<void>;
  getAccessToken(forceRefresh?: boolean): Promise<string>;
  onUserChanged(callback: (user: IUser | null) => void): () => void;
  getUserId(): string;
  get loggedUser(): IUser | null;
}
