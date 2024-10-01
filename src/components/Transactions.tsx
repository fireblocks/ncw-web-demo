import React from "react";
import { useAppStore } from "../AppStore";
import { TransactionRow } from "./TransactionRow";
import { IActionButtonProps } from "./ui/ActionButton";
import { TxsCard } from "./ui/Card";
import { NewTxDialog } from "./ui/NewTxDialog";

export const Transactions: React.FC = () => {
  const {
    txs,
    accounts,
    signSomething,
    saasTxToOTA,
    saasTxToNCW,
    saasTxToVault,
    saasStartListenToTxs,
    saasStopListenToTxs,
  } = useAppStore();
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
  const signSomethingAction: IActionButtonProps = {
    action: signSomething,
    label: "Sign Something",
  };

  // SAAS
  const saasTxToOTAAction: IActionButtonProps = {
    action: saasTxToOTA,
    label: "Create Tx to OTA",
  };
  const saasTxToNCWAction: IActionButtonProps = {
    action: saasTxToNCW,
    label: "Create Tx to NCW",
  };
  const saasTxToVaultAction: IActionButtonProps = {
    action: saasTxToVault,
    label: "Create Tx to Vault",
  };
  const saasStartListenToTxsAction: IActionButtonProps = {
    action: saasStartListenToTxs,
    label: "Start listening to txs",
  };
  const saasStopListenToTxsAction: IActionButtonProps = {
    action: saasStopListenToTxs,
    label: "Stop listening to txs",
  };

  return (
    <TxsCard
      title="Transactions"
      actions={[
        createTxAction,
        saasTxToOTAAction,
        saasTxToNCWAction,
        saasTxToVaultAction,
        saasStartListenToTxsAction,
        saasStopListenToTxsAction,
        signSomethingAction,
      ]}
    >
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
    </TxsCard>
  );
};
