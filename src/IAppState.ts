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

export interface IAssetInfo {
  asset: IWalletAsset;
  balance?: IAssetBalance;
  address?: IAssetAddress;
}
type TAccount = Record<string, IAssetInfo>;
type TSupportedAssets = Record<string, IWalletAsset>;

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
  passphrase: string | null;
  accounts: TAccount[];
  supportedAssets: Record<number, TSupportedAssets>;
  initAppStore: () => void;
  disposeAppStore: () => void;
  login(provider: "GOOGLE" | "APPLE"): Promise<void>;
  logout: () => Promise<void>;
  clearSDKStorage: () => Promise<void>;
  setDeviceId: (deviceId: string) => void;
  loginToDemoAppServer: () => void;
  assignCurrentDevice: () => Promise<void>;
  generateNewDeviceId: () => Promise<void>;
  joinExistingWallet: () => Promise<void>;
  approveJoinWallet: () => Promise<boolean>;
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
  setPassphrase: (passphrase: string) => void;
  recoverKeys: () => Promise<void>;
  backupKeys: () => Promise<void>;
  regeneratePassphrase: () => void;
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
