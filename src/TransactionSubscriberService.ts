import { EmbeddedWallet } from "@fireblocks/embedded-wallet-sdk";
import { ITransactionData } from "./services/ApiService";
import { isFinal } from "./components/TransactionRow";

const DEFAULT_SLEEP_TIME_MS = 10_000; // 10 seconds

export type TTxCallback = (txs: ITransactionData[]) => void;
export class TransactionSubscriberService {
  private static _instance: TransactionSubscriberService | null = null;
  private _active = false;
  private _outgoingAfter = 0;
  private _incomingAfter = 0;

  private constructor(private _fireblocksEW: EmbeddedWallet) {}

  static async initialize(fireblocksEW: EmbeddedWallet) {
    if (this._instance) {
      return this._instance;
    }
    const txSubscriber = new TransactionSubscriberService(fireblocksEW);
    this._instance = txSubscriber;
    return txSubscriber;
  }

  public async listenToTransactions(callback: TTxCallback) {
    if (this._active) {
      console.log("already listening to transactions");
      return;
    }
    console.log("started listening to transactions...");
    this._active = true;
    while (this._active) {
      try {
        const txs = await this.fetchTransactions();
        callback(txs);
        await this._sleep();
      } catch (error) {
        console.error("Error while fetching transactions", error);
        await this._sleep();
      }
    }
  }

  public async fetchTransactions(): Promise<ITransactionData[]> {
    const [outgoingTxs, incomingTxs] = await Promise.all([
      this._fireblocksEW.getTransactions({ source: true, after: this._outgoingAfter }),
      this._fireblocksEW.getTransactions({ destination: true, after: this._incomingAfter }),
    ]);

    this._outgoingAfter = this._updateAfterTimestamp(outgoingTxs, this._outgoingAfter);
    this._incomingAfter = this._updateAfterTimestamp(incomingTxs, this._incomingAfter);

    const txMap = new Map<string, any>();
    [...outgoingTxs, ...incomingTxs].forEach((tx) => {
      txMap.set(tx.id, tx);
    });
    const response = Array.from(txMap.values()).map(this._transactionResponseToTransactionData);
    return response;
  }

  private _updateAfterTimestamp(txs: any[], currentAfter: number): number {
    const nonFinalTxs = txs.filter((tx) => !isFinal(tx.status as any));
    if (nonFinalTxs.length > 0) {
      const result = Math.min(...nonFinalTxs.map((tx) => tx.createdAt));
      return isFinite(result) ? result : currentAfter;
    } else {
      const result = Math.max(...txs.map((tx) => tx.createdAt));
      return isFinite(result) ? result : currentAfter;
    }
  }

  public stopListening() {
    console.log("stopping to listen to transactions...");
    this._active = false;
  }

  private _transactionResponseToTransactionData(tx: any): ITransactionData {
    return {
      id: tx.id,
      status: tx.status as any,
      createdAt: tx.createdAt,
      lastUpdated: tx.lastUpdated,
      details: {
        id: tx.id,
        assetId: tx.assetId,
        source: tx.source,
        destination: tx.destination,
        requestedAmount: tx.requestedAmount,
        amountInfo: tx.amountInfo!,
        feeInfo: tx.feeInfo!,
        amount: tx.amount,
        netAmount: tx.netAmount,
        amountUSD: tx.amountUSD,
        serviceFee: tx.serviceFee!,
        networkFee: tx.networkFee,
        createdAt: tx.createdAt,
        lastUpdated: tx.lastUpdated,
        status: tx.status,
        txHash: tx.txHash,
        index: tx.index!,
        subStatus: tx.subStatus!,
        sourceAddress: tx.sourceAddress!,
        destinationAddress: tx.destinationAddress,
        destinationAddressDescription: tx.destinationAddressDescription!,
        destinationTag: tx.destinationTag,
        signedBy: tx.signedBy,
        createdBy: tx.createdBy,
        rejectedBy: tx.rejectedBy,
        addressType: tx.addressType,
        note: tx.note,
        exchangeTxId: tx.exchangeTxId,
        feeCurrency: tx.feeCurrency,
        numOfConfirmations: tx.numOfConfirmations!,
        extraParameters: tx.extraParameters,
        operation: tx.operation,
        treatAsGrossAmount: tx.treatAsGrossAmount,
      },
    };
  }
  private _sleep(ms: number = DEFAULT_SLEEP_TIME_MS) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
