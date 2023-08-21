import { FireblocksNCW, IKeyDescriptor, TMPCAlgorithm } from "@fireblocks/ncw-js-sdk";
import { ITransactionData } from "./services/ApiService";
import { TAsyncActionStatus, TFireblocksNCWStatus } from "./AppStore";

export interface IAppState {
  automateInitialization: boolean;
  userId: string | null;
  deviceId: string;
  walletId: string | null;
  txs: ITransactionData[];
  appStoreInitialized: boolean;
  loginToDemoAppServerStatus: TAsyncActionStatus;
  assignDeviceStatus: TAsyncActionStatus;
  fireblocksNCW: FireblocksNCW | null;
  fireblocksNCWStatus: TFireblocksNCWStatus;
  keysStatus: Record<TMPCAlgorithm, IKeyDescriptor> | null;
  passphrase: string | null;
  initAppStore: (token: string) => void;
  disposeAppStore: () => void;
  loginToDemoAppServer: () => void;
  assignCurrentDevice: () => Promise<void>;
  generateNewDeviceId: () => Promise<void>;
  createTransaction: () => Promise<void>;
  setPassphrase: (passphrase: string) => void;
  regeneratePassphrase: () => void;
  initFireblocksNCW: () => Promise<void>;
  disposeFireblocksNCW: () => void;
}
