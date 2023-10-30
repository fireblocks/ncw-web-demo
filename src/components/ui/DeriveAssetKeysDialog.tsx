import React from "react";
import { useAppStore } from "../../AppStore";
import { Autocomplete, IAutoCompleteItem } from "./Autocomplete";
import { IWalletAsset } from "../../services/ApiService";

interface IAssetListItem extends IAutoCompleteItem {
  coinType: number;
  accountId: number;
  addressIndex: number;
}

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeriveAssetKeysDialog: React.FC<IProps> = ({ isOpen, onClose }) => {
  const { deriveAssetKey, refreshAccounts, accounts } = useAppStore();
  const [assetIdPrompt, setAssetIdPrompt] = React.useState<string | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = React.useState(false);

  const [extendedPrivateKey, setExtendedPrivateKey] = React.useState<string>("");
  const [derivedAssetKey, setDerivedAssetKey] = React.useState<string | null>(null);

  const assetsListItems = React.useMemo(() => {
    return accounts.reduce<IAssetListItem[]>((assets, account) => {
      Object.keys(account).forEach((assetId) => {
        const assetInfo = account[assetId];
        if (assetInfo.asset.type === "BASE_ASSET") {
          const asset: IWalletAsset = assetInfo.asset;
          const accountId = Number(assetInfo.address?.accountId ?? 0);
          const addressIndex = Number(assetInfo.address?.addressIndex ?? 0);
          const assetListItem: IAssetListItem = {
            id: `ACCOUNT_#${accountId}_${asset.id}`,
            name: asset.name,
            iconUrl: asset.iconUrl,
            coinType: asset.coinType,
            accountId,
            addressIndex,
          };
          assets.push(assetListItem);
        }
      });
      return assets;
    }, []);
  }, [accounts]);

  const getDerivationPathStr = () => {
    if (!assetIdPrompt || assetsListItems.length === 0) {
      return null;
    }
    const assetListItem = assetsListItems.find((assetListItem) => assetListItem.id === assetIdPrompt);
    if (!assetListItem) {
      return null;
    }

    const coinType: number = assetListItem.coinType;
    const account: number = assetListItem.accountId;
    const change: number = 0;
    const index: number = assetListItem.addressIndex;
    return `m/44'/${coinType}'/${account}'/${change}/${index}`;
  };

  const reloadAssets = React.useCallback(async () => {
    setIsLoadingAssets(true);
    await refreshAccounts();
    setIsLoadingAssets(false);
  }, [refreshAccounts]);

  React.useEffect(() => {
    if (isOpen) {
      reloadAssets();
    }
  }, [isOpen, refreshAccounts]);

  let modalClassName = "modal modal-bottom sm:modal-middle";
  if (isOpen) {
    modalClassName += " modal-open";
  }

  const doDeriveAssetKey = () => {
    if (!assetIdPrompt || assetsListItems.length === 0) {
      return null;
    }
    const assetListItem = assetsListItems.find((assetListItem) => assetListItem.id === assetIdPrompt);
    if (!assetListItem) {
      return null;
    }

    const coinType: number = assetListItem.coinType;
    const account: number = assetListItem.accountId;
    const change: number = 0;
    const index: number = assetListItem.addressIndex;
    const derivedAssetKey = deriveAssetKey(extendedPrivateKey, coinType, account, change, index);
    setDerivedAssetKey(derivedAssetKey);
  };

  const updateExtendedPrivateKey = (extendedPrivateKey: string) => {
    setExtendedPrivateKey(extendedPrivateKey);
    setDerivedAssetKey(null);
  };

  const closeDialog = () => {
    setExtendedPrivateKey("");
    setDerivedAssetKey(null);
    setAssetIdPrompt(null);
    onClose();
  };

  return (
    <div className={modalClassName}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Derive Asset Keys</h3>
        <div className="grid grid-cols-[150px_auto] gap-2 pt-10 pb-10">
          <label className="label">
            <span className="label-text">Extended Private Key:</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={extendedPrivateKey}
            onChange={(e) => updateExtendedPrivateKey(e.currentTarget.value)}
          />
          <label className="label">
            <span className="label-text">Asset:</span>
          </label>
          <Autocomplete value={assetIdPrompt ?? ""} onChange={setAssetIdPrompt} items={assetsListItems} />
          <label className="label">
            <span className="label-text">Derivation Path:</span>
          </label>
          <label className="label">
            <span className="label-text">{getDerivationPathStr() ?? "--"}</span>
          </label>
        </div>
        <div>
          <label className="label">
            <span className="label-text">
              <strong>Derived Key:</strong>
            </span>
          </label>
          <textarea className="input input-bordered w-full h-20 resize-none" readOnly value={derivedAssetKey ?? ""} />
        </div>
        <div className="modal-action">
          <button
            className="btn btn-primary disabled"
            onClick={doDeriveAssetKey}
            disabled={extendedPrivateKey.length === 0 || !assetIdPrompt || isLoadingAssets}
          >
            Derive Asset Key
          </button>
          <button className="btn" onClick={closeDialog}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
