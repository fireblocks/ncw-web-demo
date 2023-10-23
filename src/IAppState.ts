import { FireblocksNCW, IKeyDescriptor, TMPCAlgorithm } from "@fireblocks/ncw-js-sdk";
import {
  IAssetAddress,
  IAssetBalance,
  ICreateWeb3ConnectionResponse,
  ITransactionData,
  IWalletAsset,
  IWeb3Session,
} from "./services/ApiService";
import { TAsyncActionStatus, TFireblocksNCWStatus } from "./AppStore";

export interface IAssetInfo {
  asset: IWalletAsset;
  balance?: IAssetBalance;
  address?: IAssetAddress;
}
type TAccount = Record<string, IAssetInfo>;
type TSupportedAssets = Record<string, IWalletAsset>;

export interface IAppState {
  automateInitialization: boolean;
  userId: string | null;
  deviceId: string;
  walletId: string | null;
  txs: ITransactionData[];
  web3Connections: IWeb3Session[];
  pendingWeb3Connection: ICreateWeb3ConnectionResponse | null;
  appStoreInitialized: boolean;
  loginToDemoAppServerStatus: TAsyncActionStatus;
  assignDeviceStatus: TAsyncActionStatus;
  fireblocksNCW: FireblocksNCW | null;
  fireblocksNCWStatus: TFireblocksNCWStatus;
  keysStatus: Record<TMPCAlgorithm, IKeyDescriptor> | null;
  passphrase: string | null;
  accounts: TAccount[];
  supportedAssets: Record<number, TSupportedAssets>;
  initAppStore: (tokenGetter: () => Promise<string>) => void;
  disposeAppStore: () => void;
  clearSDKStorage: () => Promise<void>;
  setDeviceId: (deviceId: string) => void;
  loginToDemoAppServer: () => void;
  assignCurrentDevice: () => Promise<void>;
  generateNewDeviceId: () => Promise<void>;
  createTransaction: () => Promise<void>;
  cancelTransaction: (txId: string) => Promise<void>;
  takeover: () => Promise<void>;
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
