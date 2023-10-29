import React from "react";
import { useAppStore } from "../../AppStore";

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeriveAssetKeysDialog: React.FC<IProps> = ({ isOpen, onClose }) => {
  const { deriveAssetKey } = useAppStore();

  const [extendedPrivateKey, setExtendedPrivateKey] = React.useState<string>("");
  const [coinType, setCoinType] = React.useState(0);
  const [account, setAccount] = React.useState(0);
  const [change, setChange] = React.useState(0);
  const [index, setIndex] = React.useState(0);
  const [derivedAssetKey, setDerivedAssetKey] = React.useState<string | null>(null);

  let modalClassName = "modal modal-bottom sm:modal-middle";
  if (isOpen) {
    modalClassName += " modal-open";
  }

  const doDeriveAssetKey = () => {
    const derivedAssetKey = deriveAssetKey(extendedPrivateKey, coinType, account, change, index);
    setDerivedAssetKey(derivedAssetKey);
  };

  const updateExtendedPrivateKey = (extendedPrivateKey: string) => {
    setExtendedPrivateKey(extendedPrivateKey);
    setDerivedAssetKey(null);
  };

  const updateCoinType = (coinType: number) => {
    setCoinType(coinType);
    setDerivedAssetKey(null);
  };

  const updateAccount = (account: number) => {
    setAccount(account);
    setDerivedAssetKey(null);
  };

  const updateChange = (change: number) => {
    setChange(change);
    setDerivedAssetKey(null);
  };

  const updateIndex = (index: number) => {
    setIndex(index);
    setDerivedAssetKey(null);
  };

  const closeDialog = () => {
    setExtendedPrivateKey("");
    setCoinType(0);
    setAccount(0);
    setChange(0);
    setIndex(0);
    setDerivedAssetKey(null);
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
            <span className="label-text">Coin Type:</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            value={coinType}
            min={0}
            onChange={(e) => updateCoinType(Number(e.currentTarget.value))}
          />
          <label className="label">
            <span className="label-text">Account:</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            value={account}
            min={0}
            onChange={(e) => updateAccount(Number(e.currentTarget.value))}
          />
          <label className="label">
            <span className="label-text">Change:</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            value={change}
            min={0}
            onChange={(e) => updateChange(Number(e.currentTarget.value))}
          />
          <label className="label">
            <span className="label-text">Index:</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            value={index}
            min={0}
            onChange={(e) => updateIndex(Number(e.currentTarget.value))}
          />
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
            disabled={extendedPrivateKey.length === 0}
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
