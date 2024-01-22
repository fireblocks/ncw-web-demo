import React from "react";
import { useAppStore } from "../AppStore";
import { AssetRow } from "./AssetRow";
import { Autocomplete } from "./ui/Autocomplete";
import { Card } from "./ui/Card";
import { IActionButtonProps } from "./ui/ActionButton";

export const Assets: React.FC = () => {
  const { accounts, refreshAccounts, addAsset, refreshSupportedAssets, supportedAssets } = useAppStore();
  const [assetIdPrompt, setAssetIdPrompt] = React.useState<string | null>(null);
  const [isAddingAsset, setIsAddingAsset] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const onAddAssetClicked = async () => {
    if (!assetIdPrompt) {
      return;
    }

    setIsAddingAsset(true);
    try {
      await addAsset(0, assetIdPrompt);
      await refreshAccounts();
      await refreshSupportedAssets(0);
    } finally {
      setIsAddingAsset(false);
      setAssetIdPrompt(null);
    }
  };

  const onRefreshClicked = async () => {
    setIsRefreshing(true)
    try {
      await refreshAccounts();
      await refreshSupportedAssets(0);
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasAccounts = accounts.length > 0;

  React.useEffect(() => {
    async function fetchAssets() {
      try {
        await refreshAccounts();
        await refreshSupportedAssets(0);
      } catch (e) {}
    }
    fetchAssets();
  }, []);

  const refreshAction: IActionButtonProps = {
    action: onRefreshClicked,
    label: "Refresh",
    isDisabled: isRefreshing,
  };

  return (
    <Card title="Assets" actions={[refreshAction]}>
      <div>
        {hasAccounts &&
          accounts.map((account, index) => (
            <div key={`account${index}`}>
              <label>Account #{index}</label>
              <table className="table table-fixed">
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
                  {Object.entries(account).map(([assetId, assetInfo]) => (
                    <AssetRow key={assetId} assetInfo={assetInfo} />
                  ))}
                </tbody>
              </table>
              <div className="grid grid-cols-[150px_auto_100px] gap-2 mb-4">
                <label className="label">
                  <span className="label-text">Add asset:</span>
                </label>

                <Autocomplete
                  value={assetIdPrompt ?? ""}
                  onChange={setAssetIdPrompt}
                  items={
                    supportedAssets[index]
                      ? Object.values(supportedAssets[index]).map(({ id, name, iconUrl }) => ({ id, name, iconUrl }))
                      : []
                  }
                />
                <button
                  className="btn btn-secondary"
                  onClick={onAddAssetClicked}
                  disabled={isAddingAsset || !assetIdPrompt || assetIdPrompt.trim().length === 0}
                >
                  Add
                </button>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
};
