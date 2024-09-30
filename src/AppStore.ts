import {
  BrowserLocalStorageProvider,
  ConsoleLoggerFactory,
  IEventsHandler,
  IFireblocksNCW,
  IJoinWalletEvent,
  IKeyBackupEvent,
  IKeyDescriptor,
  IKeyRecoveryEvent,
  SigningInProgressError,
  TEnv,
  TEvent,
  TMPCAlgorithm,
  version as fireblocksNCWSdkVersion,
  getFireblocksNCWInstance,
} from "@fireblocks/ncw-js-sdk";
import { create } from "zustand";
import { IAppState, IPassphraseInfo, TPassphrases, TAppMode, INewTransactionData, IBackupInfo } from "./IAppState";
import { generateDeviceId, getOrCreateDeviceId, storeDeviceId } from "./deviceId";
import { ENV_CONFIG } from "./env_config";
import { ApiService, IAssetAddress, ITransactionData, IWalletAsset, TPassphraseLocation } from "./services/ApiService";
import { PasswordEncryptedLocalStorage } from "./services/PasswordEncryptedLocalStorage";
import { IAuthManager } from "./auth/IAuthManager";
import { FirebaseAuthManager } from "./auth/FirebaseAuthManager";
import { decode } from "js-base64";
import { IndexedDBLoggerFactory } from "./logger/IndexedDBLogger.factory";
import { IndexedDBLogger } from "./logger/IndexedDBLogger";
import { EmbeddedWallet } from "@fireblocks/embedded-wallet-sdk";
import {
  ICreateTransactionParams,
  IEmbeddedWalletOptions,
  INcwCoreOptions,
} from "@fireblocks/embedded-wallet-sdk/dist/src/types";

export type TAsyncActionStatus = "not_started" | "started" | "success" | "failed";
export type TFireblocksNCWStatus = "sdk_not_ready" | "initializing_sdk" | "sdk_available" | "sdk_initialization_failed";
export type TRequestDecodedData = { email: string; requestId: string; platform: string };

export const useAppStore = create<IAppState>()((set, get) => {
  // let apiService: ApiService | null = null;
  let txsUnsubscriber: (() => void) | null = null;
  let fireblocksNCW: IFireblocksNCW | null = null;
  let fireblocksEW: EmbeddedWallet;
  let logger: IndexedDBLogger | null = null;
  const authManager: IAuthManager = new FirebaseAuthManager();
  authManager.onUserChanged((user) => {
    set({ loggedUser: user });
  });

  const updateOrAddTx = (
    existingTxs: ITransactionData[],
    newTxs: ITransactionData | ITransactionData[],
  ): ITransactionData[] => {
    const result = [...existingTxs];
    const txsToAdd = Array.isArray(newTxs) ? newTxs : [newTxs];

    txsToAdd.forEach((newTx) => {
      const index = result.findIndex((tx) => tx.id === newTx.id);
      if (index === -1) {
        result.push(newTx);
      } else {
        result[index] = newTx;
      }
    });

    return result.sort((t1, t2) => (t2.lastUpdated ?? 0) - (t1.lastUpdated ?? 0));
  };

  return {
    fireblocksNCWSdkVersion,
    automateInitialization: ENV_CONFIG.AUTOMATE_INITIALIZATION,
    joinExistingWalletMode: false,
    loggedUser: authManager.loggedUser,
    appMode: null,
    userId: null,
    walletId: null,
    latestBackup: null,
    pendingWeb3Connection: null,
    web3Connections: [],
    txs: [],
    appStoreInitialized: false,
    deviceId: null,
    loginToDemoAppServerStatus: "not_started",
    assignDeviceStatus: "not_started",
    joinWalletStatus: "not_started",
    fireblocksNCWStatus: "sdk_not_ready",
    addDeviceRequestId: null,
    keysStatus: null,
    passphrase: null,
    passphrases: null,
    regeneratePassphrase: () => {},
    accounts: [],
    supportedAssets: {},
    initAppStore: () => {
      try {
        // apiService = new ApiService(ENV_CONFIG.BACKEND_BASE_URL, authManager);
        set((state) => ({ ...state, appStoreInitialized: true }));
      } catch (e) {
        console.error(`Failed to initialize ApiService: ${e}`);
        set((state) => ({ ...state, appStoreInitialized: false }));
      }
    },
    disposeAppStore: () => {
      set((state) => ({ ...state, appStoreInitialized: false }));
    },
    async getGoogleDriveCredentials(): Promise<string> {
      return await authManager.getGoogleDriveCredentials();
    },
    async login(provider: "GOOGLE" | "APPLE"): Promise<void> {
      await authManager.login(provider);
      set({
        loggedUser: authManager.loggedUser,
      });
    },
    async logout(): Promise<void> {
      await authManager.logout();
      const { disposeAppStore, disposeFireblocksNCW } = get();
      disposeAppStore();
      disposeFireblocksNCW();
      set({
        loggedUser: null,
        userId: null,
        walletId: null,
        deviceId: null,
        pendingWeb3Connection: null,
        latestBackup: null,
        web3Connections: [],
        txs: [],
        appStoreInitialized: false,
        loginToDemoAppServerStatus: "not_started",
        assignDeviceStatus: "not_started",
        joinWalletStatus: "not_started",
        fireblocksNCWStatus: "sdk_not_ready",
        keysStatus: null,
        accounts: [],
        supportedAssets: {},
      });
    },
    assignCurrentDevice: async () => {
      set((state) => ({ ...state, walletId: null, assignDeviceStatus: "started" }));
      if (!fireblocksEW) {
        throw new Error("fireblocksEW is not initialized");
      }
      try {
        const assignResponse = await fireblocksEW.assignWallet();
        const walletId = assignResponse.walletId;
        const accounts = await fireblocksEW.getAccounts();
        console.log("@@@ DEBUGS | initFireblocksNCW: | accounts:", accounts);
        if (accounts.data.length === 0) {
          const account = await fireblocksEW.createAccount();
          console.log("@@@ DEBUGS | initFireblocksNCW: | account:", account);
        }
        set((state) => ({ ...state, walletId, assignDeviceStatus: "success" }));
      } catch (e) {
        console.error(e);
        set((state) => ({ ...state, walletId: null, assignDeviceStatus: "failed" }));
      }
    },
    askToJoinWalletExisting: async () => {
      set((state) => ({ ...state, joinWalletStatus: "started" }));
      const { walletId, deviceId } = get();
      if (!walletId) {
        throw new Error("walletId is not set");
      }
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }

      try {
        //@ts-ignore
        await fireblocksEW.askToJoinWalletExisting(deviceId, walletId);
        set((state) => ({
          ...state,
          deviceId,
          walletId,
          assignDeviceStatus: "success",
          joinWalletStatus: "success",
          joinExistingWalletMode: true,
        }));
      } catch (e) {
        set((state) => ({
          ...state,
          deviceId: null,
          walletId: null,
          assignDeviceStatus: "failed",
          joinWalletStatus: "failed",
        }));
      }
    },
    generateNewDeviceId: async () => {
      const { userId } = get();
      if (!userId) {
        throw new Error("First login to demo app server");
      }
      const deviceId = generateDeviceId();
      set((state) => ({ ...state, deviceId, walletId: null, assignDeviceStatus: "not_started" }));
      storeDeviceId(deviceId, userId);
    },
    setAppMode: (appMode: TAppMode) => {
      set((state) => ({ ...state, appMode, assignDeviceStatus: "not_started" }));
    },
    setDeviceId: (deviceId: string) => {
      const { userId } = get();
      if (!userId) {
        throw new Error("First login to demo app server");
      }
      storeDeviceId(deviceId, userId);
      set((state) => ({ ...state, deviceId }));
    },
    setWalletId: (walletId: string) => {
      set((state) => ({ ...state, walletId }));
    },
    setPassphrase: (passphrase: string) => {
      const { userId } = get();
      if (!userId) {
        throw new Error("First login to demo app server");
      }
    },
    getLatestBackup: async () => {
      const { walletId } = get();
      if (!walletId) {
        throw new Error("No wallet set");
      }
      const latestBackup: any = await fireblocksEW.getLatestBackup();
      set((state) => ({ ...state, latestBackup }));
    },
    approveJoinWallet: async () => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      const requestData = await prompt("Insert encoded request data");
      if (requestData) {
        try {
          const decodedData: TRequestDecodedData = JSON.parse(decode(requestData));
          const result = await fireblocksNCW.approveJoinWalletRequest(decodedData.requestId);
          console.log("approveJoinWallet result:", result);
        } catch (e) {
          console.error(e);
        }
        // set((state) => ({ ...state, passphrase }));
      } else {
        console.log("approveJoinWallet cancelled");
      }
    },
    joinExistingWallet: async () => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      await fireblocksNCW.requestJoinExistingWallet({
        onRequestId(requestId: string) {
          set((state) => ({ ...state, addDeviceRequestId: requestId }));
        },
      });
    },
    stopJoinExistingWallet: () => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      fireblocksNCW.stopJoinWallet();
    },
    getPassphraseInfos: async () => {
      //@ts-ignore
      // const { passphrases } = await fireblocksEW.getPassphraseInfos();
      const passphrases: { passphrases: IPassphraseInfo[] } = {
        passphrases: [],
      };

      try {
        const res = (await fireblocksEW.getLatestBackup()) as IBackupInfo;
        passphrases.passphrases.push({ passphraseId: res.passphraseId, location: "GoogleDrive" });
      } catch (e) {}

      const reduced = passphrases.passphrases.reduce<TPassphrases>((p, v) => {
        p[v.passphraseId] = v;
        return p;
      }, {});
      set((state) => ({ ...state, passphrases: reduced }));
    },
    createPassphraseInfo: async (passphraseId: string, location: TPassphraseLocation) => {
      //@ts-ignore
      // await fireblocksEW.createPassphraseInfo(passphraseId, location);
      const passphraseInfo: IPassphraseInfo = { passphraseId, location };
      set((state) => ({ ...state, passphrases: { ...state.passphrases, [passphraseId]: passphraseInfo } }));
    },
    backupKeys: async (passphrase: string, passphraseId: string) => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      if (!passphrase) {
        throw new Error("passphrase is not set");
      }
      if (!passphraseId) {
        throw new Error("passphraseId is not set");
      }

      await fireblocksNCW.backupKeys(passphrase, passphraseId);
    },
    recoverKeys: async (passphraseResolver: (passphraseId: string) => Promise<string>) => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      await fireblocksNCW.recoverKeys(passphraseResolver);
      const keysStatus = await fireblocksNCW.getKeysStatus();
      set((state) => ({ ...state, keysStatus }));
    },
    loginToDemoAppServer: async () => {
      set((state) => ({ ...state, userId: null, loginToDemoAppServerStatus: "started" }));
      try {
        const userId = authManager.getUserId();
        set((state) => ({
          ...state,
          userId,
          loginToDemoAppServerStatus: "success",
          deviceId: getOrCreateDeviceId(userId),
        }));
      } catch (e) {
        set((state) => ({ ...state, userId: null, loginToDemoAppServerStatus: "failed" }));
      }
    },
    initFireblocksNCW: async () => {
      fireblocksNCW = null;
      set((state) => ({ ...state, fireblocksNCWStatus: "initializing_sdk" }));
      try {
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

              case "join_wallet_descriptor":
                console.log(`join wallet event: ${JSON.stringify((event as IJoinWalletEvent).joinWalletDescriptor)}`);
                break;
            }
          },
        };

        const { deviceId } = get();
        if (!deviceId) {
          throw new Error("deviceId is not set");
        }
        const storageProvider = new BrowserLocalStorageProvider();
        const secureStorageProvider = new PasswordEncryptedLocalStorage(deviceId, () => {
          const password = prompt("Enter password", "");
          if (password === null) {
            return Promise.reject(new Error("Rejected by user"));
          }
          return Promise.resolve(password || "");
        });
        logger = await IndexedDBLoggerFactory({ deviceId, logger: ConsoleLoggerFactory() });
        const ewOpts: IEmbeddedWalletOptions = {
          env: ENV_CONFIG.NCW_SDK_ENV as TEnv,
          logLevel: "VERBOSE",
          logger,
          authClientId: ENV_CONFIG.AUTH_CLIENT_ID,
          authTokenRetriever: {
            getAuthToken: () => authManager.getAccessToken(),
          },
          reporting: {
            enabled: false,
          },
        };
        const coreNCWOptions: INcwCoreOptions = {
          deviceId,
          eventsHandler,
          secureStorageProvider,
          storageProvider,
        };
        fireblocksEW = EmbeddedWallet.getInstance(ewOpts.authClientId) ?? EmbeddedWallet.initialize(ewOpts);
        fireblocksNCW = EmbeddedWallet.getCore(deviceId) ?? (await fireblocksEW.initializeCore(coreNCWOptions));

        // txsUnsubscriber = apiService.listenToTxs(deviceId, (tx: ITransactionData) => {
        //   const txs = updateOrAddTx(get().txs, tx);
        //   set((state) => ({ ...state, txs }));
        // });
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
    createTransaction: async (dataToSend?: INewTransactionData) => {
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      //@ts-ignore
      const newTxData = await apiService.createTransaction(deviceId, dataToSend);
      const txs = updateOrAddTx(get().txs, newTxData);
      set((state) => ({ ...state, txs }));
    },
    cancelTransaction: async (txId: string) => {
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      await fireblocksEW.cancelTransaction(txId);
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
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      //@ts-ignore
      const connections = await apiService.getWeb3Connections(deviceId);
      set((state) => ({ ...state, web3Connections: connections }));
    },
    createWeb3Connection: async (uri: string) => {
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      //@ts-ignore
      const response = await apiService.createWeb3Connection(deviceId, uri);
      set((state) => ({ ...state, pendingWeb3Connection: response }));
    },
    approveWeb3Connection: async () => {
      const { deviceId, pendingWeb3Connection } = get();
      if (!pendingWeb3Connection) {
        throw new Error("no pending connection");
      }
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      //@ts-ignore
      await apiService.approveWeb3Connection(deviceId, pendingWeb3Connection.id);
      set((state) => ({ ...state, pendingWeb3Connection: null }));
    },
    denyWeb3Connection: async () => {
      const { deviceId, pendingWeb3Connection } = get();
      if (!pendingWeb3Connection) {
        throw new Error("no pending connection");
      }
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      //@ts-ignore
      await apiService.denyWeb3Connection(deviceId, pendingWeb3Connection.id);
      set((state) => ({ ...state, pendingWeb3Connection: null }));
    },
    removeWeb3Connection: async (sessionId: string) => {
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      //@ts-ignore
      await apiService.removeWeb3Connection(deviceId, sessionId);

      set((state) => ({ ...state, web3Connections: state.web3Connections.filter((s) => s.id !== sessionId) }));
    },

    generateMPCKeys: async () => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      const algosToGenerate = Array.from(
        document.querySelectorAll('input[type="checkbox"][id="algosToGenerate"]:checked'),
      ).map((checkbox: any) => checkbox.value);
      const ALGORITHMS = new Set<TMPCAlgorithm>(algosToGenerate);
      const started = Date.now();
      await fireblocksNCW.generateMPCKeys(ALGORITHMS);
      console.log(`// @@@ DEBUGS: took ${Date.now() - started}ms to generate keys`);
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
      const res = await fireblocksNCW.takeover();
      console.log("@@@ DEBUGS | takeover: | res:", res);
      return res;
    },
    exportFullKeys: (chainCode: string, cloudKeyShares: Map<string, string[]>) => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      return fireblocksNCW.exportFullKeys(chainCode, cloudKeyShares);
    },
    deriveAssetKey: (extendedPrivateKey: string, coinType: number, account: number, change: number, index: number) => {
      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      return fireblocksNCW.deriveAssetKey(extendedPrivateKey, coinType, account, change, index);
    },
    disposeFireblocksNCW: async () => {
      if (!fireblocksNCW) {
        return;
      }

      if (txsUnsubscriber) {
        txsUnsubscriber();
        txsUnsubscriber = null;
      }

      await fireblocksNCW.dispose();
      fireblocksNCW = null;
      set((state) => ({ ...state, fireblocksNCWStatus: "sdk_not_ready" }));
    },

    addAsset: async (accountId: number, assetId: string) => {
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      const address: any = await fireblocksEW.addAsset(accountId, assetId);
      console.log("@@@ DEBUGS | addAsset: | address:", address);
      const asset: any = await fireblocksEW.getAsset(accountId, assetId);
      console.log("@@@ DEBUGS | addAsset: | asset:", asset);
      set((state) => ({
        ...state,
        accounts: state.accounts.map((assets, index) =>
          index === accountId ? { ...assets, ...{ [assetId]: { asset, address } } } : assets,
        ),
      }));
    },

    refreshAccounts: async () => {
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      const allAccounts = await fireblocksEW.getAccounts();

      set((state) => ({
        ...state,
        accounts: Array.from({ length: allAccounts.data.length }, (_v, i) => ({ ...state.accounts[i] })),
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
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      const assets = await fireblocksEW.getAssets(accountId);
      const reduced = assets.data.reduce<Record<string, { asset: IWalletAsset }>>((acc, asset) => {
        acc[asset.id] = { asset };
        return acc;
      }, {});

      set((state) => ({
        ...state,
        accounts: state.accounts.map((v, i) => (i === accountId ? { ...reduced, ...v } : v)),
      }));
    },

    refreshSupportedAssets: async (accountId: number) => {
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      const assets = await fireblocksEW.getSupportedAssets();
      console.log("@@@ DEBUGS | refreshSupportedAssets: | assets:", assets.data.length);
      const reduced = assets.data.reduce<Record<string, IWalletAsset>>((acc, asset) => {
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
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }

      const balance = await fireblocksEW.getAssetBalance(accountId, assetId);

      set((state) => ({
        ...state,
        accounts: state.accounts.map((v, i) =>
          i === accountId ? { ...v, ...{ [assetId]: { ...v[assetId], balance } } } : v,
        ),
      }));
    },

    refreshAddress: async (accountId: number, assetId: string) => {
      const { deviceId } = get();
      if (!deviceId) {
        throw new Error("deviceId is not set");
      }
      const address = (await fireblocksEW.getAddresses(accountId, assetId)).data;
      console.log("@@@ DEBUGS | refreshAddress: | address:", address);

      set((state) => ({
        ...state,
        accounts: state.accounts.map((v, i) =>
          i === accountId ? { ...v, ...{ [assetId]: { ...v[assetId], address: address[0] } } } : v,
        ),
      }));
    },
    collectLogs: async () => {
      if (!logger) {
        return;
      }
      const limitInput = await prompt("Enter number of logs to collect (empty for all)");
      const limit = limitInput ? parseInt(limitInput) : null;
      const logs = await logger.collect(limit);
      const logsString = logs.map((log) => JSON.stringify(log)).join("\n");

      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(new Blob([logsString], { type: "text/plain" }));
      downloadLink.download = `${Date.now()}_ncw-sdk-logs.log`;
      downloadLink.click();
      logger.log("INFO", `Collected ${logs.length} logs`);
    },
    clearLogs: async () => {
      if (!logger) {
        return;
      }
      const limitInput = await prompt("Enter number of logs to clear (empty for all)");
      const limit = limitInput ? parseInt(limitInput) : null;
      const clearedLogsNum = await logger.clear(limit);
      logger.log("INFO", `Cleared logs: ${clearedLogsNum}`);
    },
    countLogs: async () => {
      if (!logger) {
        return;
      }
      const numberOfLogs = await logger.count();
      logger.log("INFO", `Number of logs: ${numberOfLogs}`);
    },
    signSomething: async () => {
      const { signTransaction } = get();

      if (!fireblocksNCW) {
        throw new Error("fireblocksNCW is not initialized");
      }
      const txId = await prompt("Insert transaction ID to sign");
      if (txId) {
        return signTransaction(txId);
      }
    },
    saasTxToOTA: async () => {
      const assetId = await prompt("Insert asset ID", "ETH_TEST6")!.toUpperCase();
      const destAddress = await prompt("Insert destination address")!;
      const amount = await prompt("Insert amount", "0.001")!;
      const params: ICreateTransactionParams = {
        assetId,
        source: {
          id: "0",
        },
        destination: {
          type: "ONE_TIME_ADDRESS" as any,
          oneTimeAddress: {
            address: destAddress,
          },
        },
        amount,
      };
      const res = await fireblocksEW.createTransaction(params);
      console.log("@@@ DEBUGS | saasTxToOTA: | res:", res);
    },
    saasTxToNCW: async () => {
      const { walletId } = get();
      const assetId = await prompt("Insert asset ID", "ETH_TEST6")!.toUpperCase();
      const destWalletId = await prompt("Insert destination walletId", walletId ?? undefined)!;
      const amount = await prompt("Insert amount", "0.001")!;
      const params: ICreateTransactionParams = {
        assetId,
        source: {
          id: "0",
        },
        destination: {
          type: "END_USER_WALLET" as any,
          walletId: destWalletId,
          id: "0",
        },
        amount,
      };
      const res = await fireblocksEW.createTransaction(params);
      console.log("@@@ DEBUGS | saasTxToNCW: | res:", res);
    },
    saasTxToVault: async () => {
      const assetId = await prompt("Insert asset ID", "ETH_TEST6")!.toUpperCase();
      const vaultAccountId = await prompt("Insert destination vaultAccountId", "0")!;
      const amount = await prompt("Insert amount", "0.001")!;
      const params: ICreateTransactionParams = {
        assetId,
        source: {
          id: "0",
        },
        destination: {
          type: "VAULT_ACCOUNT" as any,
          id: vaultAccountId,
        },
        amount,
      };
      const res = await fireblocksEW.createTransaction(params);
      console.log("@@@ DEBUGS | saasTxToVault: | res:", res);
    },
    saasGetTxs: async () => {
      const { txs: currTxs } = get();
      const mostRecentTx = Math.max(...currTxs.map((tx) => tx.createdAt ?? 0));
      const after = Number.isFinite(mostRecentTx) ? mostRecentTx : 0;
      const response = await fireblocksEW.getTransactions({
        after,
      });
      console.log("@@@ DEBUGS | saasGetTxs: | response:", response);

      const txs = updateOrAddTx(
        get().txs,
        response.map((tx) => ({
          id: tx.id,
          status: tx.status as any,
          createdAt: tx.createdAt,
          lastUpdated: tx.lastUpdated,
        })),
      );
      set((state) => ({ ...state, txs }));
    },
  };
});
