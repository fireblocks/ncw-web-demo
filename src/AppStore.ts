import {
  ConsoleLogger,
  FireblocksNCW,
  IEventsHandler,
  IKeyBackupEvent,
  IKeyDescriptor,
  IKeyRecoveryEvent,
  IMessagesHandler,
  SigningInProgressError,
  TEnv,
  TEvent,
  TMPCAlgorithm,
} from "@fireblocks/ncw-js-sdk";
import { create } from "zustand";
import { IAppState } from "./IAppState";
import { generateDeviceId, getOrCreateDeviceId, storeDeviceId } from "./deviceId";
import { ENV_CONFIG } from "./env_config";
import { ApiService, ITransactionData, IWalletAsset } from "./services/ApiService";
import { PasswordEncryptedLocalStorage } from "./services/PasswordEncryptedLocalStorage";
import { randomPassPhrase } from "./services/randomPassPhrase";

const rememberBackupPassphrase = (passphrase: string) => {
  localStorage.setItem("DEMO_APP:backup-passphrase", passphrase);
};

const getBackupPassphrase = (): string | null => {
  return localStorage.getItem("DEMO_APP:backup-passphrase") ?? null;
};

export type TAsyncActionStatus = "not_started" | "started" | "success" | "failed";
export type TFireblocksNCWStatus = "sdk_not_ready" | "initializing_sdk" | "sdk_available" | "sdk_initialization_failed";

export const useAppStore = create<IAppState>()((set, get) => {
  let apiService: ApiService | null = null;
  let txsUnsubscriber: (() => void) | null = null;
  let fireblocksNCW: FireblocksNCW | null = null;

  const updateOrAddTx = (existingTxs: ITransactionData[], newTx: ITransactionData): ITransactionData[] => {
    const index = existingTxs.findIndex((tx) => tx.id === newTx.id);
    if (index === -1) {
      return [...existingTxs, newTx];
    }
    const result = [...existingTxs];
    result[index] = newTx;
    return result.sort((t1, t2) => (t2.lastUpdated ?? 0) - (t1.lastUpdated ?? 0));
  };

  return {
    automateInitialization: ENV_CONFIG.AUTOMATE_INITIALIZATION,
    userId: null,
    walletId: null,
    pendingWeb3Connection: null,
    web3Connections: [],
    txs: [],
    appStoreInitialized: false,
    deviceId: getOrCreateDeviceId(),
    loginToDemoAppServerStatus: "not_started",
    assignDeviceStatus: "not_started",
    fireblocksNCWStatus: "sdk_not_ready",
    keysStatus: null,
    passphrase: getBackupPassphrase(),
    accounts: [],
    supportedAssets: {},
    initAppStore: (tokenGetter: () => Promise<string>) => {
      try {
        apiService = new ApiService(ENV_CONFIG.BACKEND_BASE_URL, tokenGetter);
        set((state) => ({ ...state, appStoreInitialized: true }));
      } catch (e) {
        console.error(`Failed to initialize ApiService: ${e}`);
        set((state) => ({ ...state, appStoreInitialized: false }));
      }
    },
    disposeAppStore: () => {
      if (apiService) {
        apiService.dispose();
        apiService = null;
        set((state) => ({ ...state, appStoreInitialized: false }));
      }
    },
    assignCurrentDevice: async () => {
      const { deviceId } = get();
      set((state) => ({ ...state, walletId: null, assignDeviceStatus: "started" }));
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      try {
        const walletId = await apiService.assignDevice(deviceId);
        set((state) => ({ ...state, walletId, assignDeviceStatus: "success" }));
      } catch (e) {
        set((state) => ({ ...state, walletId: null, assignDeviceStatus: "failed" }));
      }
    },
    generateNewDeviceId: async () => {
      const deviceId = generateDeviceId();
      set((state) => ({ ...state, deviceId, walletId: null, assignDeviceStatus: "not_started", passphrase: null }));
      storeDeviceId(deviceId);
    },
    setDeviceId: (deviceId: string) => {
      storeDeviceId(deviceId);
      set((state) => ({ ...state, deviceId }));
    },
    setPassphrase: (passphrase: string) => {
      rememberBackupPassphrase(passphrase);
      set((state) => ({ ...state, passphrase }));
    },
    regeneratePassphrase: () => {
      const passphrase = randomPassPhrase();
      rememberBackupPassphrase(passphrase);
      set((state) => ({ ...state, passphrase }));
    },
    backupKeys: async () => {
      const { passphrase } = get();
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      if (!passphrase) {
        throw new Error("passphrase is not set");
      }
      await fireblocksNCW.backupKeys(passphrase);
    },
    recoverKeys: async () => {
      const { passphrase } = get();
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      if (!passphrase) {
        throw new Error("passphrase is not set");
      }
      await fireblocksNCW.recoverKeys(passphrase);
      const keysStatus = await fireblocksNCW.getKeysStatus();
      set((state) => ({ ...state, keysStatus }));
    },
    loginToDemoAppServer: async () => {
      set((state) => ({ ...state, userId: null, loginToDemoAppServerStatus: "started" }));
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      try {
        const userId = await apiService.login();
        set((state) => ({ ...state, userId, loginToDemoAppServerStatus: "success" }));
      } catch (e) {
        set((state) => ({ ...state, userId: null, loginToDemoAppServerStatus: "failed" }));
      }
    },
    initFireblocksNCW: async () => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      fireblocksNCW = null;
      set((state) => ({ ...state, fireblocksNCWStatus: "initializing_sdk" }));
      try {
        const messagesHandler: IMessagesHandler = {
          handleOutgoingMessage: (message: string) => {
            if (!apiService) {
              throw new Error("apiService is not initialized");
            }
            return apiService.sendMessage(deviceId, message);
          },
        };

        const eventsHandler: IEventsHandler = {
          handleEvent: (event: TEvent) => {
            switch (event.type) {
              case "key_descriptor_changed":
                const keysStatus: Record<TMPCAlgorithm, IKeyDescriptor> =
                  get().keysStatus ?? ({} as Record<TMPCAlgorithm, IKeyDescriptor>);
                keysStatus[event.keyDescriptor.algorithm] = event.keyDescriptor;
                set((state) => ({ ...state, keysStatus }));
                break;

              case "transaction_signature_changed":
                console.log(`Transaction signature status: ${event.transactionSignature.transactionSignatureStatus}`);
                break;

              case "keys_backup":
                console.log(`Key backup status: ${JSON.stringify((event as IKeyBackupEvent).keysBackup)}`);
                break;

              case "keys_recovery":
                console.log(`Key recover status: ${JSON.stringify((event as IKeyRecoveryEvent).keyDescriptor)}`);
                break;
            }
          },
        };

        const { deviceId } = get();
        const secureStorageProvider = new PasswordEncryptedLocalStorage(deviceId, () => {
          const password = prompt("Enter password", "");
          if (password === null) {
            return Promise.reject(new Error("Rejected by user"));
          }
          return Promise.resolve(password || "");
        });

        fireblocksNCW = await FireblocksNCW.initialize({
          env: ENV_CONFIG.NCW_SDK_ENV as TEnv,
          deviceId,
          messagesHandler,
          eventsHandler,
          secureStorageProvider,
          logger: new ConsoleLogger(),
        });

        txsUnsubscriber = apiService.listenToTxs(deviceId, (tx: ITransactionData) => {
          const txs = updateOrAddTx(get().txs, tx);
          set((state) => ({ ...state, txs }));
        });
        const keysStatus = await fireblocksNCW.getKeysStatus();
        set((state) => ({ ...state, keysStatus, fireblocksNCWStatus: "sdk_available" }));
      } catch (e) {
        console.error(e);
        fireblocksNCW = null;
        set((state) => ({
          ...state,
          keysStatus: null,
          fireblocksNCWStatus: "sdk_initialization_failed",
        }));
      }
    },
    clearSDKStorage: async () => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      await fireblocksNCW.clearAllStorage();
      const keysStatus = await fireblocksNCW.getKeysStatus();
      set((state) => ({ ...state, keysStatus }));
    },
    createTransaction: async () => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId } = get();
      const newTxData = await apiService.createTransaction(deviceId);
      const txs = updateOrAddTx(get().txs, newTxData);
      set((state) => ({ ...state, txs }));
    },
    cancelTransaction: async (txId: string) => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId } = get();
      await apiService.cancelTransaction(deviceId, txId);
      set((state) => {
        const index = state.txs.findIndex((t) => t.id === txId);
        if (index === -1) {
          return state;
        }
        return {
          ...state,
          txs: [
            ...state.txs.slice(0, index),
            { ...state.txs[index], status: "CANCELLING" },
            ...state.txs.slice(index + 1),
          ],
        };
      });
    },
    signTransaction: async (txId: string) => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { signTransaction } = get();
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }

      try {
        await fireblocksNCW.signTransaction(txId);
      } catch (err: unknown) {
        if (err instanceof SigningInProgressError) {
          if (err.txId === txId) {
            throw err;
          } else {
            await fireblocksNCW.stopInProgressSignTransaction();
            signTransaction(txId); // recall signTransaction
          }
        } else {
          throw err;
        }
      }
    },
    getWeb3Connections: async () => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }

      const { deviceId } = get();
      const connections = await apiService.getWeb3Connections(deviceId);
      set((state) => ({ ...state, web3Connections: connections }));
    },
    createWeb3Connection: async (uri: string) => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }

      const { deviceId } = get();
      const response = await apiService.createWeb3Connection(deviceId, uri);
      set((state) => ({ ...state, pendingWeb3Connection: response }));
    },
    approveWeb3Connection: async () => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId, pendingWeb3Connection } = get();
      if (!pendingWeb3Connection) {
        throw new Error("no pending connection");
      }
      await apiService.approveWeb3Connection(deviceId, pendingWeb3Connection.id);
      set((state) => ({ ...state, pendingWeb3Connection: null }));
    },
    denyWeb3Connection: async () => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId, pendingWeb3Connection } = get();
      if (!pendingWeb3Connection) {
        throw new Error("no pending connection");
      }
      await apiService.denyWeb3Connection(deviceId, pendingWeb3Connection.id);
      set((state) => ({ ...state, pendingWeb3Connection: null }));
    },
    removeWeb3Connection: async (sessionId: string) => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId } = get();
      await apiService.removeWeb3Connection(deviceId, sessionId);

      set((state) => ({ ...state, web3Connections: state.web3Connections.filter((s) => s.id !== sessionId) }));
    },
    generateMPCKeys: async () => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      const ALGORITHMS = new Set<TMPCAlgorithm>(["MPC_CMP_ECDSA_SECP256K1"]);
      await fireblocksNCW.generateMPCKeys(ALGORITHMS);
    },
    stopMpcDeviceSetup: async () => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      await fireblocksNCW.stopMpcDeviceSetup();
    },
    takeover: async () => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      return fireblocksNCW.takeover();
    },
    exportFullKeys: (chainCode: string, cloudKeyShares: Map<string, string[]>) => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      return fireblocksNCW.exportFullKeys(chainCode, cloudKeyShares);
    },
    deriveAssetKey: (
      extendedPrivateKey: string,
      coinType: number,
      account: number,
      change: number,
      index: number,
    ) => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      return fireblocksNCW.deriveAssetKey(extendedPrivateKey, coinType, account, change, index);
    },
    disposeFireblocksNCW: () => {
      if (!fireblocksNCW) {
        return;
      }

      if (txsUnsubscriber) {
        txsUnsubscriber();
        txsUnsubscriber = null;
      }

      fireblocksNCW.dispose();
      fireblocksNCW = null;
      set((state) => ({ ...state, fireblocksNCWStatus: "sdk_not_ready" }));
    },

    addAsset: async (accountId: number, assetId: string) => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId } = get();
      const address = await apiService.addAsset(deviceId, accountId, assetId);
      const asset = await apiService.getAsset(deviceId, accountId, assetId);
      set((state) => ({
        ...state,
        accounts: state.accounts.map((assets, index) =>
          index === accountId ? { ...assets, ...{ [assetId]: { asset, address } } } : assets,
        ),
      }));
    },

    refreshAccounts: async () => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId } = get();
      const allAccounts = await apiService.getAccounts(deviceId);

      set((state) => ({
        ...state,
        accounts: Array.from({ length: allAccounts.length }, (_v, i) => ({ ...state.accounts[i] })),
      }));

      // refresh all
      const { refreshAssets, refreshAddress, refreshBalance } = get();
      await Promise.all(get().accounts.map((_v, id) => refreshAssets(id)));
      await Promise.all([
        ...get().accounts.flatMap((v, id) => Object.keys(v).map((assetId) => refreshAddress(id, assetId))),
        ...get().accounts.flatMap((v, id) => Object.keys(v).map((assetId) => refreshBalance(id, assetId))),
      ]);
    },

    refreshAssets: async (accountId: number) => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId } = get();
      const assets = await apiService.getAssets(deviceId, accountId);
      const reduced = assets.reduce<Record<string, { asset: IWalletAsset }>>((acc, asset) => {
        acc[asset.id] = { asset };
        return acc;
      }, {});

      set((state) => ({
        ...state,
        accounts: state.accounts.map((v, i) => (i === accountId ? { ...reduced, ...v } : v)),
      }));
    },

    refreshSupportedAssets: async (accountId: number) => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId } = get();
      const assets = await apiService.getSupportedAssets(deviceId, accountId);
      const reduced = assets.reduce<Record<string, IWalletAsset>>((acc, asset) => {
        acc[asset.id] = asset;
        return acc;
      }, {});

      set((state) => ({
        ...state,
        supportedAssets: {
          ...state.supportedAssets,
          [accountId]: reduced,
        },
      }));
    },

    refreshBalance: async (accountId: number, assetId: string) => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId } = get();
      const balance = await apiService.getBalance(deviceId, accountId, assetId);

      set((state) => ({
        ...state,
        accounts: state.accounts.map((v, i) =>
          i === accountId ? { ...v, ...{ [assetId]: { ...v[assetId], balance } } } : v,
        ),
      }));
    },

    refreshAddress: async (accountId: number, assetId: string) => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      const { deviceId } = get();
      const address = await apiService.getAddress(deviceId, accountId, assetId);

      set((state) => ({
        ...state,
        accounts: state.accounts.map((v, i) =>
          i === accountId ? { ...v, ...{ [assetId]: { ...v[assetId], address } } } : v,
        ),
      }));
    },
  };
});
