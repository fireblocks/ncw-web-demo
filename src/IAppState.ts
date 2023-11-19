import { IKeyDescriptor, TMPCAlgorithm, IFullKey } from "@fireblocks/ncw-js-sdk";
import { TAsyncActionStatus, TFireblocksNCWStatus } from "./AppStore";
import {
  IAssetAddress,
  IAssetBalance,
  ICreateWeb3ConnectionResponse,
  ITransactionData,
  IWalletAsset,
  IWeb3Session,
} from "./services/ApiService";
import { IUser } from "./auth/IAuthManager";
import { PassphraseLocation } from "./services/ApiService";

export interface IAssetInfo {
  asset: IWalletAsset;
  balance?: IAssetBalance;
  address?: IAssetAddress;
}

export interface IPassphraseInfo {
  passphraseId: string;
  location: PassphraseLocation,
}

type TAccount = Record<string, IAssetInfo>;
type TSupportedAssets = Record<string, IWalletAsset>;
export type TPassphrases = Record<string, IPassphraseInfo>;

export interface IAppState {
  fireblocksNCWSdkVersion: string;
  automateInitialization: boolean;
  loggedUser: IUser | null;
  userId: string | null;
  deviceId: string | null;
  walletId: string | null;
  txs: ITransactionData[];
  web3Connections: IWeb3Session[];
  pendingWeb3Connection: ICreateWeb3ConnectionResponse | null;
  appStoreInitialized: boolean;
  loginToDemoAppServerStatus: TAsyncActionStatus;
  assignDeviceStatus: TAsyncActionStatus;
  fireblocksNCWStatus: TFireblocksNCWStatus;
  keysStatus: Record<TMPCAlgorithm, IKeyDescriptor> | null;
  accounts: TAccount[];
  passphrases: TPassphrases | null;
  supportedAssets: Record<number, TSupportedAssets>;
  initAppStore: () => void;
  disposeAppStore: () => void;
  getGoogleDriveCredentials: () => Promise<string>;
  login(provider: 'GOOGLE' | 'APPLE'): Promise<void>;
  logout: () => Promise<void>;
  clearSDKStorage: () => Promise<void>;
  setDeviceId: (deviceId: string) => void;
  loginToDemoAppServer: () => void;
  assignCurrentDevice: () => Promise<void>;
  generateNewDeviceId: () => Promise<void>;
  generateMPCKeys: () => Promise<void>;
  stopMpcDeviceSetup: () => Promise<void>;
  createTransaction: () => Promise<void>;
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
  getPassphraseInfos: () => Promise<void>,
  createPassphraseInfo: (passphraseId: string, location: PassphraseLocation) => Promise<void>,
  recoverKeys: (passphraseResolver:  (passphraseId: string) => Promise<string>) => Promise<void>;
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
