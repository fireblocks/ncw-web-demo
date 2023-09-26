import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";
import { AssetRow } from "./AssetRow";

export const Assets: React.FC = () => {
  const {
    accounts,
    refreshAccounts,
    addAsset,
    addAssetPrompt,
    setAddAssetPrompt,
  } = useAppStore();

  const onRefreshClicked = async () => {
    await refreshAccounts();
  };

  const onAddAssetClicked = async () => {
    if (!addAssetPrompt) {
        return;
    }

    await addAsset(0, addAssetPrompt);
  }


  const refeshAction: ICardAction = {
    action: onRefreshClicked,
    label: "Refresh",
  };

  const hasAccounts = accounts.length > 0;

  return (
    <Card title="Assets" actions={[refeshAction]}>
      <div className="overflow-x-auto">
        {hasAccounts && (
            accounts.map((account, index) => (
                <div key={`account${index}`}>
                    <label>Account #{index}</label>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Address</th>
                            <th>Balance</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.entries(account).map(([assetId, asset]) => (
                            <AssetRow key={assetId} asset={asset.asset} balance={asset.balance} address={asset.address} />
                        ))}
                        </tbody>
                    </table>
                    <div className="grid grid-cols-[150px_auto_100px] gap-2">
                        <label className="label">
                        <span className="label-text">Add asset:</span>
                        </label>
                        <input type="text" className="input input-bordered" value={addAssetPrompt ?? ""} onChange={(e) => setAddAssetPrompt(e.currentTarget.value)} />
                        <button
                        className="btn btn-secondary"
                        onClick={onAddAssetClicked}
                        disabled={!addAssetPrompt || addAssetPrompt.trim().length === 0}
                        >
                        Add
                        </button>
                    </div>
                </div>
            )))
        }
      </div>
    </Card>
  );
};
