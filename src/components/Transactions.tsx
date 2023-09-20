import React from "react";
import { useAppStore } from "../AppStore";
import { TransactionRow } from "./TransactionRow";
import { Card, ICardAction } from "./ui/Card";

export const Transactions: React.FC = () => {
  const { createTransaction, txs } = useAppStore();

  const onCreateTransactionClicked = async () => {
    await createTransaction();
  };

  const createTxAction: ICardAction = {
    action: onCreateTransactionClicked,
    label: "Create Tx",
  };

  return (
    <Card title="Transactions" actions={[createTxAction]}>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>TxId</th>
              <th>Last updated</th>
              <th>Asset</th>
              <th>Operation</th>
              <th>Status</th>
              <th>Direction</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
