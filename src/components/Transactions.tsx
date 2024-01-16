import React from "react";
import { useAppStore } from "../AppStore";
import { TransactionRow } from "./TransactionRow";
import { IActionButtonProps } from "./ui/ActionButton";
import { Card } from "./ui/Card";
import { NewTxDialog } from "./ui/NewTxDialog";

export const Transactions: React.FC = () => {
  const { txs, accounts } = useAppStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const onOpenModal = () => setIsModalOpen(true);
  const onCloseModal = () => setIsModalOpen(false);

  const assetsToSelectFrom = React.useMemo(() => {
    const assetsList = accounts.map((account) => {
      return Object.entries(account).map(([_, assetInfo]) => {
        const { id, name, iconUrl } = assetInfo.asset;
        return { id, name, iconUrl, balance: assetInfo.balance?.total ?? "" };
      });
    });

    return assetsList[0];
  }, [accounts]);

  const createTxAction: IActionButtonProps = {
    action: onOpenModal,
    label: "Create Tx",
    isDisabled: !assetsToSelectFrom?.length,
  };

  return (
    <Card title="Transactions" actions={[createTxAction]}>
      <div className="overflow-x-auto">
        <table className="table table-fixed">
          <thead>
            <tr>
              <th>TxId</th>
              <th>Last updated</th>
              <th>Asset</th>
              <th>Operation</th>
              <th>Status</th>
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

      {assetsToSelectFrom && (
        <NewTxDialog isOpen={isModalOpen} onClose={onCloseModal} assetsToSelectFrom={assetsToSelectFrom} />
      )}
    </Card>
  );
};
