import React from "react";

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (chainCode: string, cloudKeyShares: Map<string, string[]>) => void;
}

export const ExportFullKeysDialog: React.FC<IProps> = ({ isOpen, onClose, onExport }) => {
  const [chainCode, setChainCode] = React.useState<string>("");
  const [keyId, setKeyId] = React.useState<string>("");
  const [playerShare, setPlayerShare] = React.useState<string>("");

  let modalClassName = "modal modal-bottom sm:modal-middle";
  if (isOpen) {
    modalClassName += " modal-open";
  }

  const doExport = () => {
    const cloudKeyShares = new Map<string, string[]>();
    cloudKeyShares.set(keyId, [playerShare]);
    onExport(chainCode, cloudKeyShares);
  };

  return (
    <div className={modalClassName}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Export Full Keys</h3>
        <div className="grid grid-cols-[100px_auto] gap-2 pt-10 pb-10">
          <label className="label">
            <span className="label-text">Chaincode:</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={chainCode}
            onChange={(e) => setChainCode(e.currentTarget.value)}
          />
          <label className="label">
            <span className="label-text">KeyId:</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={keyId}
            onChange={(e) => setKeyId(e.currentTarget.value)}
          />
          <label className="label">
            <span className="label-text">Player share:</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={playerShare}
            onChange={(e) => setPlayerShare(e.currentTarget.value)}
          />
        </div>
        <div className="modal-action">
          <label className="btn btn-primary" onClick={doExport}>
            Export
          </label>
          <label className="btn" onClick={onClose}>
            Close
          </label>
        </div>
      </div>
    </div>
  );
};
