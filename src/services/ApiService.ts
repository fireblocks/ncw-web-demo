import { IPassphraseInfo } from "../IAppState";
import { IAuthManager } from "../auth/IAuthManager";

export type TTransactionStatus =
  | "PENDING_SIGNATURE"
  | "SUBMITTED"
  | "FAILED"
  | "COMPLETED"
  | "CANCELLED"
  | "CONFIRMING"
  | "QUEUED"
  | "CANCELLING";

export interface ITransferPeer {
  id: string;
  type: string;
  name?: string;
  walletId?: string;
}

export interface IAmountInfo {
  amount?: string;
  requestedAmount?: string;
  netAmount?: string;
  amountUSD?: string;
}

export interface IFeeInfo {
  networkFee?: string;
  serviceFee?: string;
  gasPrice?: string;
}

export interface ITransactionDetails {
  id: string; //	ID of the transaction.
  assetId: string; //	Transaction asset.
  source: ITransferPeer; //	Source of the transaction.
  destination: ITransferPeer; //	Fireblocks supports multiple destinations for UTXO-based blockchains. For other blockchains, this array will always be composed of one element.
  requestedAmount: number; //	The amount requested by the user.
  amountInfo: IAmountInfo; //	Details of the transaction's amount in string format.
  feeInfo: IFeeInfo; //	Details of the transaction's fee in string format.
  amount: number; //	If the transfer is a withdrawal from an exchange, the actual amount that was requested to be transferred. Otherwise, the requested amount.
  netAmount: number; //	The net amount of the transaction, after fee deduction.
  amountUSD: number; //	The USD value of the requested amount.
  serviceFee: number; //	The total fee deducted by the exchange from the actual requested amount (serviceFee = amount - netAmount).
  treatAsGrossAmount: boolean; //	For outgoing transactions, if true, the network fee is deducted from the requested amount.
  networkFee: number; //	The fee paid to the network.
  createdAt: number; //	Unix timestamp.
  lastUpdated: number; //	Unix timestamp.
  status: string; //		The current status of the transaction.
  txHash: string; //	Blockchain hash of the transaction.
  index: number; //[optional] For UTXO based assets this is the vOut, for Ethereum based, this is the index of the event of the contract call.
  subStatus: string; //		More detailed status of the transaction.
  sourceAddress: string; //For account based assets only, the source address of the transaction. (Note: This parameter will be empty for transactions that are not: CONFIRMING, COMPLETED, or REJECTED/FAILED after passing CONFIRMING status.)
  destinationAddress: string; //Address where the asset were transferred.
  destinationAddressDescription: string; //Description of the address.
  destinationTag: string; //Destination tag for XRP, used as memo for EOS/XLM, or Bank Transfer Description for the fiat providers: Signet (by Signature), SEN (by Silvergate), or BLINC (by BCB Group).
  signedBy: string[]; // Signers of the transaction.
  createdBy: string; //Initiator of the transaction.
  rejectedBy: string; //User ID of the user that rejected the transaction (in case it was rejected).
  addressType: string; //[ ONE_TIME, WHITELISTED ].
  note: string; //Custom note of the transaction.
  exchangeTxId: string; //If the transaction originated from an exchange, this is the exchange tx ID.
  feeCurrency: string; //The asset which was taken to pay the fee (ETH for ERC-20 tokens, BTC for Tether Omni).
  operation: string; //	Default operation is "TRANSFER".
  numOfConfirmations: number; //The number of confirmations of the transaction. The number will increase until the transaction will be considered completed according to the confirmation policy.
  extraParameters: any; // JSON object	Protocol / operation specific parameters.
}

export interface ITransactionData {
  id: string;
  status: TTransactionStatus;
  createdAt?: number;
  lastUpdated?: number;
  details?: ITransactionDetails;
}

export interface ICreateWeb3ConnectionResponse {
  id: string;
  sessionMetadata: ISessionMetadata;
}
export interface ISessionMetadata {
  appUrl: string;
  appIcon?: string;
  appId?: string;
  appName?: string;
  appDescription?: string;
}

export interface IWeb3Session {
  id: string;
  vaultAccountId?: number;
  ncwId?: string;
  ncwAccountId?: number;
  chainIds?: string[];
  feeLevel: "HIGH" | "MEDIUM";
  creationDate: string;
  sessionMetadata?: ISessionMetadata;
}

export interface IWalletAsset {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  networkProtocol: string;
  testnet: boolean;
  hasFee: boolean;
  type: string;
  baseAsset: string;
  ethNetwork?: number;
  ethContractAddress?: string;
  issuerAddress?: string;
  blockchainSymbol?: string;
  deprecated?: boolean;
  coinType: number;
  blockchain: string;
  blockchainDisplayName?: string;
  blockchainId?: string;
  iconUrl?: string;
  rate?: number;
}

export interface IAssetAddress {
  accountName: string;
  accountId: string;
  asset: string;
  address: string;
  addressType: string;
  addressDescription?: string;
  tag?: string;
  addressIndex?: number;
  legacyAddress?: string;
}

export interface IAssetBalance {
  id: string;
  total: string;
  /**
   * @deprecated Replaced by "total"
   */
  balance?: string;
  lockedAmount?: string;
  available?: string;
  pending?: string;
  selfStakedCPU?: string;
  selfStakedNetwork?: string;
  pendingRefundCPU?: string;
  pendingRefundNetwork?: string;
  totalStakedCPU?: string;
  totalStakedNetwork?: string;
  blockHeight?: string;
  blockHash?: string;
}

export type TMessageHandler = (message: any) => Promise<void>;
export type TTxHandler = (tx: ITransactionData) => void;

export enum PassphraseLocation {
  GoogleDrive = "GoogleDrive",
  iCloud = "iCloud",
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class ApiService {
  private readonly _baseUrl: string;
  private _deviceTxsSubscriptions: Map<string, TTxHandler[]> = new Map();
  private _disposed: boolean = false;
  private _pollingTxsActive: Map<string, boolean> = new Map();

  constructor(
    baseUrl: string,
    private readonly authManager: IAuthManager,
  ) {
    this._baseUrl = baseUrl;
    if (this._baseUrl.endsWith("/")) {
      this._baseUrl = this._baseUrl.slice(0, -1);
    }
  }

  public async login(): Promise<string> {
    const response = await this._postCall(`api/login`);
    const userId = response.id;
    return userId;
  }

  public async getPassphraseInfo(passphraseId: string): Promise<{ location: PassphraseLocation }> {
    const response = await this._getCall(`api/passphrase/${passphraseId}`);
    return await response.json();
  }

  public async createPassphraseInfo(passphraseId: string, location: PassphraseLocation) {
    const response = await this._postCall(`api/passphrase/${passphraseId}`, { location });
    return response;
  }

  public async getPassphraseInfos(): Promise<{ passphrases: IPassphraseInfo[] }> {
    const response = await this._getCall(`api/passphrase/`);
    return await response.json();
  }

  public async assignDevice(deviceId: string): Promise<string> {
    const response = await this._postCall(`api/devices/${deviceId}/assign`);
    return response.walletId;
  }

  public sendMessage(deviceId: string, message: string): Promise<any> {
    return this._postCall(`api/devices/${deviceId}/rpc`, { message });
  }

  public async getWeb3Connections(deviceId: string): Promise<IWeb3Session[]> {
    const response = await this._getCall(`api/devices/${deviceId}/web3/connections`);
    return await response.json();
  }

  public async createWeb3Connection(deviceId: string, uri: string): Promise<ICreateWeb3ConnectionResponse> {
    const response = await this._postCall(`api/devices/${deviceId}/web3/connections`, { uri });
    return response;
  }

  public async approveWeb3Connection(deviceId: string, sessionId: string): Promise<void> {
    const response = await this._postCall(`api/devices/${deviceId}/web3/connections/${sessionId}/approve`);
    return response;
  }

  public async denyWeb3Connection(deviceId: string, sessionId: string): Promise<void> {
    const response = await this._postCall(`api/devices/${deviceId}/web3/connections/${sessionId}/deny`);
    return response;
  }

  public async removeWeb3Connection(deviceId: string, sessionId: string) {
    const response = await this._deleteCall(`api/devices/${deviceId}/web3/connections/${sessionId}`);
    return response;
  }

  public async createTransaction(deviceId: string): Promise<ITransactionData> {
    const createTxResponse = await this._postCall(`api/devices/${deviceId}/transactions`);
    return createTxResponse;
  }

  public async cancelTransaction(deviceId: string, txId: string): Promise<void> {
    const response = await this._postCall(`api/devices/${deviceId}/transactions/${txId}/cancel`);
    return response;
  }

  public async addAsset(deviceId: string, accountId: number, assetId: string): Promise<IAssetAddress> {
    const response = await this._postCall(`api/devices/${deviceId}/accounts/${accountId}/assets/${assetId}`);
    return await response;
  }

  public async getAsset(deviceId: string, accountId: number, assetId: string): Promise<IWalletAsset> {
    const response = await this._getCall(`api/devices/${deviceId}/accounts/${accountId}/assets/${assetId}`);
    return await response.json();
  }

  public async getAccounts(deviceId: string): Promise<{ walletId: string; accountId: number }[]> {
    const response = await this._getCall(`api/devices/${deviceId}/accounts/`);
    return await response.json();
  }

  public async getAssets(deviceId: string, accountId: number): Promise<IWalletAsset[]> {
    const response = await this._getCall(`api/devices/${deviceId}/accounts/${accountId}/assets`);
    return await response.json();
  }

  public async getSupportedAssets(deviceId: string, accountId: number): Promise<IWalletAsset[]> {
    const response = await this._getCall(`api/devices/${deviceId}/accounts/${accountId}/assets/supported_assets`);
    return await response.json();
  }

  public async getAddress(deviceId: string, accountId: number, assetId: string): Promise<IAssetAddress> {
    const response = await this._getCall(`api/devices/${deviceId}/accounts/${accountId}/assets/${assetId}/address`);
    return await response.json();
  }

  public async getBalance(deviceId: string, accountId: number, assetId: string): Promise<IAssetBalance> {
    const response = await this._getCall(`api/devices/${deviceId}/accounts/${accountId}/assets/${assetId}/balance`);
    return await response.json();
  }

  public listenToTxs(deviceId: string, cb: TTxHandler): () => void {
    let subscriptions = this._deviceTxsSubscriptions.get(deviceId);
    if (!subscriptions) {
      subscriptions = [];
      this._deviceTxsSubscriptions.set(deviceId, subscriptions);
    }

    subscriptions.push(cb);
    this._startPollingTxs(deviceId);
    return () => {
      this._stopPollingTxs(deviceId);

      if (subscriptions) {
        const index = subscriptions.indexOf(cb);
        if (index !== -1) {
          subscriptions.splice(index, 1);
          if (subscriptions.length === 0) {
            this._deviceTxsSubscriptions.delete(deviceId);
          }
        }
      }
    };
  }

  public dispose(): void {
    this._deviceTxsSubscriptions.clear();
    this._pollingTxsActive.clear();
    this._disposed = true;
  }

  ///// PRIVATE /////

  private async _stopPollingTxs(deviceId: string): Promise<void> {
    this._pollingTxsActive.delete(deviceId);
  }

  private async _startPollingTxs(deviceId: string): Promise<void> {
    if (this._pollingTxsActive.get(deviceId)) {
      return;
    }
    this._pollingTxsActive.set(deviceId, true);
    let startDate = 0;
    while (!this._disposed) {
      try {
        const response = await this._getCall(
          `api/devices/${deviceId}/transactions?poll=true&startDate=${startDate}&details=true`,
        );
        if (!response.ok) {
          await sleep(5_000);
          continue;
        }

        const txes = await response.json();
        if (txes && Array.isArray(txes)) {
          for (const txData of txes) {
            const txId = txData.id;
            const lastUpdated = txData.lastUpdated;
            if (txId !== undefined && lastUpdated !== undefined) {
              // remember the last tx date
              startDate = Math.max(startDate, lastUpdated);
              // notify all subscribers
              const subscribers = this._deviceTxsSubscriptions.get(deviceId);
              if (subscribers) {
                for (const cb of subscribers) {
                  if (this._disposed || !this._pollingTxsActive.get(deviceId)) {
                    break;
                  }
                  cb(txData);
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("failed to get txs", e);
        await sleep(5_000);
      }
    }
  }

  private async _postCall(path: string, body?: Object): Promise<any> {
    if (path.startsWith("/")) {
      path = path.slice(1);
    }
    const token = await this.authManager.getAccessToken();
    const response = await fetch(`${this._baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body ?? {}),
    });

    if (!response.ok) {
      throw new Error(`A call to "${path}" failed with status ${response.status}`);
    }
    const responseJson = await response.json();
    return responseJson;
  }

  private async _deleteCall(path: string): Promise<void> {
    const token = await this.authManager.getAccessToken();
    await fetch(`${this._baseUrl}/${path}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
  }

  private async _getCall(path: string): Promise<Response> {
    const token = await this.authManager.getAccessToken();
    const response = await fetch(`${this._baseUrl}/${path}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    return response;
  }
}
