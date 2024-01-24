import { IKeyDescriptor, TMPCAlgorithm, IFullKey } from "@fireblocks/ncw-js-sdk";
import { TAsyncActionStatus, TFireblocksNCWStatus } from "./AppStore";
import {
  IAssetAddress,
  IAssetBalance,
  ICreateWeb3ConnectionResponse,
  ITransactionData,
  IWalletAsset,
  IWeb3Session,
  TPassphraseLocation,
} from "./services/ApiService";
import { IUser } from "./auth/IAuthManager";

export interface IAssetInfo {
  asset: IWalletAsset;
  balance?: IAssetBalance;
  address?: IAssetAddress;
}

export interface IPassphraseInfo {
  passphraseId: string;
  location: TPassphraseLocation;
}

type TAccount = Record<string, IAssetInfo>;
type TSupportedAssets = Record<string, IWalletAsset>;
export type TAppMode = "SIGN_IN" | "JOIN" | null;
export type TPassphrases = Record<string, IPassphraseInfo>;

export interface IBackupInfo {
  passphraseId: string;
  location: TPassphraseLocation;
  createdAt: number;
}

export interface INewTransactionData {
  note: string;
  accountId: string;
  assetId: string;
  amount: string;
  destAddress: string;
  feeLevel: "LOW" | "MEDIUM" | "HIGH";
  estimateFee: boolean;
}

export interface IAppState {
  appMode: TAppMode;
  fireblocksNCWSdkVersion: string;
  automateInitialization: boolean;
  joinExistingWalletMode: boolean;
  loggedUser: IUser | null;
  userId: string | null;
  deviceId: string | null;
  walletId: string | null;
  latestBackup: IBackupInfo | null;
  txs: ITransactionData[];
  web3Connections: IWeb3Session[];
  pendingWeb3Connection: ICreateWeb3ConnectionResponse | null;
  appStoreInitialized: boolean;
  loginToDemoAppServerStatus: TAsyncActionStatus;
  assignDeviceStatus: TAsyncActionStatus;
  joinWalletStatus: TAsyncActionStatus;
  fireblocksNCWStatus: TFireblocksNCWStatus;
  keysStatus: Record<TMPCAlgorithm, IKeyDescriptor> | null;
  passphrase: string | null;
  addDeviceRequestId: string | null;
  accounts: TAccount[];
  passphrases: TPassphrases | null;
  supportedAssets: Record<number, TSupportedAssets>;
  initAppStore: () => void;
  disposeAppStore: () => void;
  getGoogleDriveCredentials: () => Promise<string>;
  login(provider: "GOOGLE" | "APPLE"): Promise<void>;
  setAppMode: (mode: TAppMode) => void;
  logout: () => Promise<void>;
  clearSDKStorage: () => Promise<void>;
  setDeviceId: (deviceId: string) => void;
  setWalletId: (walletId: string) => void;
  loginToDemoAppServer: () => void;
  assignCurrentDevice: () => Promise<void>;
  askToJoinWalletExisting: () => Promise<void>;
  generateNewDeviceId: () => Promise<void>;
  generateMPCKeys: () => Promise<void>;
  stopMpcDeviceSetup: () => Promise<void>;
  createTransaction: (dataToSend?: INewTransactionData) => Promise<void>;
  cancelTransaction: (txId: string) => Promise<void>;
  signTransaction: (txId: string) => Promise<void>;
  takeover: () => Promise<IFullKey[]>;
  exportFullKeys: (chainCode: string, cloudKeyShares: Map<string, string[]>) => Promise<IFullKey[]>;
  deriveAssetKey: (
    extendedPrivateKey: string,
    coinType: number,
    account: number,
    change: number,
    index: number,
  ) => string;
  setPassphrase: (passphrase: string) => void;
  approveJoinWallet: () => Promise<void>;
  joinExistingWallet: () => Promise<void>;
  stopJoinExistingWallet: () => void;
  regeneratePassphrase: () => void;
  getPassphraseInfos: () => Promise<void>;
  getLatestBackup: () => Promise<void>;
  createPassphraseInfo: (passphraseId: string, location: TPassphraseLocation) => Promise<void>;
  recoverKeys: (passphraseResolver: (passphraseId: string) => Promise<string>) => Promise<void>;
  backupKeys: (passhrase: string, passphraseId: string) => Promise<void>;
  initFireblocksNCW: () => Promise<void>;
  disposeFireblocksNCW: () => void;
  getWeb3Connections: () => Promise<void>;
  createWeb3Connection: (uri: string) => Promise<void>;
  approveWeb3Connection: () => Promise<void>;
  denyWeb3Connection: () => Promise<void>;
  removeWeb3Connection: (sessionId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  refreshBalance: (accountId: number, assetId: string) => Promise<void>;
  refreshAssets: (accountId: number) => Promise<void>;
  refreshSupportedAssets: (accountId: number) => Promise<void>;
  refreshAddress: (accountId: number, assetId: string) => Promise<void>;
  addAsset: (accountId: number, assetId: string) => Promise<void>;
}
