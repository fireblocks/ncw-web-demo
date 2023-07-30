import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";

export const Transactions: React.FC = () => {
  const { createTransaction, fireblocksNCW, txs } = useAppStore((appStore) => ({
    createTransaction: appStore.createTransaction,
    fireblocksNCW: appStore.fireblocksNCW,
    txs: appStore.txs,
  }));
  const [inProgressTxs, setInProgressTxs] = React.useState<string[]>([]);

  const onSignTransactionClicked = async (txId: string) => {
    if (!fireblocksNCW) {
      return;
    }

    setInProgressTxs([...inProgressTxs, txId]);
    fireblocksNCW.signTransaction(txId);
  };

  const onCreateTransactionClicked = async () => {
    await createTransaction();
  };

  const createTxAction: ICardAction = {
    action: onCreateTransactionClicked,
    label: "Create Tx",
  };

  const getIsInProgress = (txId: string) => {
    return inProgressTxs.includes(txId);
  };

  return (
    <Card title="Transactions" actions={[createTxAction]}>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>TxId</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => {
              const inProgress = getIsInProgress(tx.id);
              const label = inProgress ? "Signing..." : "Sign";
              return (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>{tx.status}</td>
                  <td>
                    {tx.status === "PENDING_SIGNATURE" ? (
                      <button
                        className="btn btn-sm btn-secondary"
                        disabled={inProgress}
                        onClick={() => onSignTransactionClicked(tx.id)}
                      >
                        {label}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
