import { create } from "zustand";
import {
  FireblocksNCW,
  IEventsHandler,
  IKeyDescriptor,
  IMessagesHandler,
  TEvent,
  TMPCAlgorithm,
} from "@fireblocks/ncw-js-sdk";
import { ApiService, ITransactionData } from "./services/ApiService";
import { IAppState } from "./IAppState";
import { generateDeviceId, getOrCreateDeviceId, setDeviceId } from "./deviceId";
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
  let messagesUnsubscriber: (() => void) | null = null;
  let txsUnsubscriber: (() => void) | null = null;

  const updateOrAddTx = (existingTxs: ITransactionData[], newTx: ITransactionData): ITransactionData[] => {
    const index = existingTxs.findIndex((tx) => tx.id === newTx.id);
    if (index === -1) {
      return [...existingTxs, newTx];
    }
    const result = [...existingTxs];
    result[index] = newTx;
    return result;
  };

  return {
    automateInitialization: true,
    userId: null,
    walletId: null,
    txs: [],
    appStoreInitialized: false,
    fireblocksNCW: null,
    deviceId: getOrCreateDeviceId(),
    loginToDemoAppServerStatus: "not_started",
    assignDeviceStatus: "not_started",
    fireblocksNCWStatus: "sdk_not_ready",
    keysStatus: null,
    passphrase: getBackupPassphrase(),
    initAppStore: (token) => {
      //   const BASE_URL = `https://dev9-ncw-demo.waterballoons.xyz`;
      const BASE_URL = `https://ncw-demo-backend.2uaqu5aka49io.eu-central-1.cs.amazonlightsail.com`;
      apiService = new ApiService(BASE_URL, token);
      set((state) => ({ ...state, appStoreInitialized: true }));
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
      set((state) => ({ ...state, deviceId, walletId: null, assignDeviceStatus: "not_started" }));
      setDeviceId(deviceId);
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
    initFireblocksNCW: async (usedPasswordStorage: boolean) => {
      if (!apiService) {
        throw new Error("apiService is not initialized");
      }
      set((state) => ({ ...state, fireblocksNCW: null, fireblocksNCWStatus: "initializing_sdk" }));
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
            if (event.type === "key_descriptor_changed") {
              const keysStatus: Record<TMPCAlgorithm, IKeyDescriptor> =
                get().keysStatus ?? ({} as Record<TMPCAlgorithm, IKeyDescriptor>);
              keysStatus[event.keyDescriptor.algorithm] = event.keyDescriptor;
              set((state) => ({ ...state, keysStatus }));
            }
          },
        };

        const { deviceId } = get();
        const secureStorageProvider = new PasswordEncryptedLocalStorage(deviceId, () => {
          const password = prompt("Enter password", "");
          return Promise.resolve(password || "");
        });

        const fireblocksNCW = await FireblocksNCW.initialize(
          deviceId,
          messagesHandler,
          eventsHandler,
          secureStorageProvider,
        );

        const physicalDeviceId = fireblocksNCW.getPhysicalDeviceId();
        messagesUnsubscriber = apiService.listenToMessages(deviceId, physicalDeviceId, (msg) =>
          fireblocksNCW.handleIncomingMessage(msg),
        );
        txsUnsubscriber = apiService.listenToTxs(deviceId, (tx: ITransactionData) => {
          const txs = updateOrAddTx(get().txs, tx);
          set((state) => ({ ...state, txs }));
        });
        const keysStatus = await fireblocksNCW.getKeysStatus();
        set((state) => ({ ...state, keysStatus, fireblocksNCW: fireblocksNCW, fireblocksNCWStatus: "sdk_available" }));
      } catch (e) {
        console.error(e);
        set((state) => ({
          ...state,
          keysStatus: null,
          fireblocksNCW: null,
          fireblocksNCWStatus: "sdk_initialization_failed",
        }));
      }
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
    disposeFireblocksNCW: () => {
      const { fireblocksNCW } = get();
      if (!fireblocksNCW) {
        return;
      }
      if (messagesUnsubscriber) {
        messagesUnsubscriber();
        messagesUnsubscriber = null;
      }

      if (txsUnsubscriber) {
        txsUnsubscriber();
        txsUnsubscriber = null;
      }

      fireblocksNCW.dispose();
      set((state) => ({ ...state, fireblocksNCW: null, fireblocksNCWStatus: "sdk_not_ready" }));
    },
  };
});
