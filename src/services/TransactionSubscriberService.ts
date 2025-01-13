import { EmbeddedWallet } from "@fireblocks/embedded-wallet-sdk";
import { ITransactionData } from "../services/ApiService";
import { isFinal } from "../components/TransactionRow";
import { TransactionResponse } from "@fireblocks/ts-sdk";
import { IGetTransactionsParams } from "@fireblocks/embedded-wallet-sdk";

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
      console.warn("transaction listener is already active...");
      return;
    }
    console.log("starting transaction listener...");
    this._active = true;
    while (this._active) {
      try {
        const txs = await this.fetchTransactions();
        callback(txs);
      } catch (error) {
        console.error("Error while fetching transactions", error);
      } finally {
        await this._sleep();
      }
    }
  }

  public async fetchTransactions(): Promise<ITransactionData[]> {
    const [outgoingTxs, incomingTxs] = await Promise.all([
      this.fetchTransactionsAllPages({
        outgoing: true,
        after: this._outgoingAfter.toString(),
      }),
      this.fetchTransactionsAllPages({
        incoming: true,
        after: this._incomingAfter.toString(),
      }),
    ]);

    this._outgoingAfter = this._updateAfterTimestamp(outgoingTxs, this._outgoingAfter);
    this._incomingAfter = this._updateAfterTimestamp(incomingTxs, this._incomingAfter);

    const txMap = new Map<string, any>();
    [...outgoingTxs, ...incomingTxs].forEach((tx) => {
      txMap.set(tx.id!, tx);
    });
    console.log("fetched transactions", txMap.size);
    const response = Array.from(txMap.values()).map(this._transactionResponseToTransactionData);
    return response;
  }

  private async fetchTransactionsAllPages(filter: IGetTransactionsParams): Promise<TransactionResponse[]> {
    const transactions: TransactionResponse[] = [];
    let pageCursor: string | null = null;

    do {
      if (pageCursor) {
        filter.pageCursor = pageCursor;
      }
      const response = await this._fireblocksEW.getTransactions(filter);
      pageCursor = response.paging?.next ?? null;
      if (response.data) {
        transactions.push(...(response.data as any));
      }
    } while (pageCursor);

    return transactions;
  }

  private _updateAfterTimestamp(txs: TransactionResponse[], currentAfter: number): number {
    let minNonFinal = Infinity;
    let maxCreatedAt = -Infinity;

    for (const tx of txs) {
      if (!isFinal(tx.status as any)) {
        if (tx.createdAt! < minNonFinal) {
          minNonFinal = tx.createdAt!;
        }
      }
      if (tx.createdAt! > maxCreatedAt) {
        maxCreatedAt = tx.createdAt!;
      }
    }

    if (minNonFinal !== Infinity) {
      return minNonFinal;
    } else if (maxCreatedAt !== -Infinity) {
      // add one to prevent fetching the same tx again
      return maxCreatedAt + 1;
    }
    return currentAfter;
  }

  public stopListening() {
    console.log("stopping transaction listener...");
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
