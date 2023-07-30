export type TTransactionStatus = "PENDING_SIGNATURE" | "SUBMITTED";

export interface ITransactionData {
  id: string;
  status: TTransactionStatus;
  createdAt?: number;
  lastUpdated?: number;
}

export type TMessageHandler = (message: any) => Promise<void>;
export type TTxHandler = (tx: ITransactionData) => void;

export class ApiService {
  private readonly _baseUrl: string;
  private readonly _token: string;
  private _deviceMessagesSubscriptions: Map<string, TMessageHandler[]> = new Map();
  private _deviceTxsSubscriptions: Map<string, TTxHandler[]> = new Map();
  private _disposed: boolean = false;
  private _pollingMessagesActive: Map<string, boolean> = new Map();
  private _pollingTxsActive: Map<string, boolean> = new Map();

  constructor(baseUrl: string, token: string) {
    this._baseUrl = baseUrl;
    this._token = token;
    if (this._baseUrl.endsWith("/")) {
      this._baseUrl = this._baseUrl.slice(0, -1);
    }
  }

  public async login(): Promise<string> {
    const response = await this._postCall(`api/login`);
    const userId = response.id;
    return userId;
  }

  public async assignDevice(deviceId: string): Promise<string> {
    const response = await this._postCall(`api/devices/${deviceId}/assign`);
    return response.walletId;
  }

  public sendMessage(deviceId: string, message: string): Promise<any> {
    return this._postCall(`api/devices/${deviceId}/rpc`, { message });
  }

  public listenToMessages(deviceId: string, physicalDeviceId: string, cb: TMessageHandler): () => void {
    let subscriptions = this._deviceMessagesSubscriptions.get(deviceId);
    if (!subscriptions) {
      subscriptions = [];
      this._deviceMessagesSubscriptions.set(deviceId, subscriptions);
    }

    subscriptions.push(cb);
    this._startPollingMessages(deviceId, physicalDeviceId);
    return () => {
      this._stopPollingMessages(deviceId);

      if (subscriptions) {
        const index = subscriptions.indexOf(cb);
        if (index !== -1) {
          subscriptions.splice(index, 1);
          if (subscriptions.length === 0) {
            this._deviceMessagesSubscriptions.delete(deviceId);
          }
        }
      }
    };
  }

  public async createTransaction(deviceId: string): Promise<ITransactionData> {
    const createTxResponse = await this._postCall(`api/devices/${deviceId}/transactions`);
    return createTxResponse;
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
    this._deviceMessagesSubscriptions.clear;
    this._pollingMessagesActive.clear();
    this._deviceTxsSubscriptions.clear;
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
      const response = await this._getCall(`api/devices/${deviceId}/transactions?poll=true&startDate=${startDate}`);
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
    }
  }

  private async _stopPollingMessages(deviceId: string): Promise<void> {
    this._pollingMessagesActive.delete(deviceId);
  }

  private async _startPollingMessages(deviceId: string, physicalDeviceId: string): Promise<void> {
    if (this._pollingMessagesActive.get(deviceId)) {
      return;
    }
    this._pollingMessagesActive.set(deviceId, true);
    while (!this._disposed) {
      const response = await this._getCall(`api/devices/${deviceId}/messages?physicalDeviceId=${physicalDeviceId}`);
      const messages = await response.json();
      if (messages && Array.isArray(messages)) {
        for (const messageData of messages) {
          // notify all subscribers
          const messageId = messageData.id;
          const message = messageData.message;
          if (messageId !== undefined && message !== undefined) {
            const subscribers = this._deviceMessagesSubscriptions.get(deviceId);
            if (subscribers) {
              for (const cb of subscribers) {
                if (this._disposed || !this._pollingMessagesActive.get(deviceId)) {
                  break;
                }

                try {
                  await cb(message);
                } catch (error) {
                  // we don't want to stop the loop
                }
              }
            }
            // ack the message (No need to await, it will happen in the background  )
            this._deleteCall(`api/devices/${deviceId}/messages/${messageId}`);
          }
        }
      }
    }
  }

  private async _postCall(path: string, body?: Object): Promise<any> {
    if (path.startsWith("/")) {
      path = path.slice(1);
    }

    const response = await fetch(`${this._baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${this._token}`,
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
    await fetch(`${this._baseUrl}/${path}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${this._token}`,
      },
    });
  }

  private async _getCall(path: string): Promise<any> {
    const response = await fetch(`${this._baseUrl}/${path}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${this._token}`,
      },
    });
    return response;
  }
}
