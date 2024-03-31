import React from "react";
import { useAppStore } from "../../AppStore";
import { Autocomplete, IAutoCompleteItem } from "./Autocomplete";
import { INewTransactionData } from "../../IAppState";

interface IProps {
  isOpen: boolean;
  assetsToSelectFrom: IAutoCompleteItem[];
  onClose: () => void;
}

export const NewTxDialog: React.FC<IProps> = ({ isOpen, onClose, assetsToSelectFrom }) => {
  const { createTransaction, deviceId } = useAppStore();
  const [assetIdPrompt, setAssetIdPrompt] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [destinationAddress, setDestinationAddress] = React.useState<string>("");
  const [txType, setTXType] = React.useState<"transfer" | "typed-message">("transfer");
  const [txFee, setTXFee] = React.useState<"LOW" | "MEDIUM" | "HIGH">("LOW");

  const clearForm = () => {
    setAssetIdPrompt("");
    setAmount("");
    setDestinationAddress("");
    setTXFee("LOW");
  };

  const closeDialog = () => {
    setTXType("transfer");
    clearForm();
    onClose();
  };

  const onCreateTransactionClicked = async () => {
    let dataToSend: INewTransactionData = {
      note: `API Transaction by ${deviceId}`,
      accountId: "0",
      assetId: assetIdPrompt,
    }

    if (txType === "transfer") {
      dataToSend = {
        ...dataToSend,
        amount: amount,
        destAddress: destinationAddress,
        feeLevel: txFee,
        estimateFee: false,
      };
    }

    await createTransaction(dataToSend);
    closeDialog();
  };

  const isValidForm = () => {
    if (txType === "transfer") {
      return assetIdPrompt && amount && destinationAddress && txFee;
    }

    if (txType === "typed-message") {
      return !!assetIdPrompt;
    }

    return false;
  };

  let modalClassName = "modal modal-bottom sm:modal-middle";
  if (isOpen) {
    modalClassName += " modal-open";
  }

  const selectedAsset = assetsToSelectFrom?.find((asset) => asset.id === assetIdPrompt);

  return (
    <div className={modalClassName}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">New Tx</h3>
        <div className="pt-6">
          <div className="mb-4">
            <p className="label-text font-bold pb-1">Current device id</p>
            <p>{deviceId}</p>
          </div>
          <div className="mb-4">
            <p className="label-text font-bold pb-1">Which type of transaction you want to create?</p>
            <div className="flex items-center gap-4">
              <div>
                <input
                  type="radio"
                  name="txType"
                  id="transfer"
                  checked={txType === "transfer"}
                  onChange={() => {
                    setTXType("transfer");
                    clearForm();
                  }}
                />
                <label htmlFor="transfer" className="pl-1">
                  Transfer
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  name="txType"
                  id="typed-message"
                  checked={txType === "typed-message"}
                  onChange={() => {
                    setTXType("typed-message");
                    clearForm();
                  }}
                />
                <label htmlFor="typed-message" className="pl-1">
                  Typed message
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <p className="label-text font-bold pb-1">Select asset</p>
          <Autocomplete value={assetIdPrompt ?? ""} onChange={setAssetIdPrompt} items={assetsToSelectFrom} />
        </div>

        <div className="mb-4">
          <p className="label-text font-bold pb-1 flex justify-between">
            <span>Amount</span> {selectedAsset ? <span>{`Max: ${selectedAsset.balance}`}</span> : ""}
          </p>
          <input
            disabled={txType === "typed-message"}
            type="text"
            className="input input-bordered w-[100%]"
            value={amount}
            onChange={(e) => setAmount(e.currentTarget.value)}
          />
        </div>
        <div className="mb-4">
          <p className="label-text font-bold pb-1">Destination address</p>
          <input
            disabled={txType === "typed-message"}
            type="text"
            className="input input-bordered w-[100%]"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.currentTarget.value)}
          />
        </div>
        <div className="mb-4">
          <p className="label-text font-bold pb-1">Select fee level</p>
          <div className="flex items-center gap-4">
            <div>
              <input
                disabled={txType === "typed-message"}
                type="radio"
                name="txFee"
                id="low"
                checked={txFee === "LOW"}
                onChange={() => setTXFee("LOW")}
              />
              <label htmlFor="low" className="pl-1">
                Low
              </label>
            </div>
            <div>
              <input
                disabled={txType === "typed-message"}
                type="radio"
                name="txFee"
                id="medium"
                checked={txFee === "MEDIUM"}
                onChange={() => setTXFee("MEDIUM")}
              />
              <label htmlFor="medium" className="pl-1">
                Medium
              </label>
            </div>
            <div>
              <input
                disabled={txType === "typed-message"}
                type="radio"
                name="txFee"
                id="high"
                checked={txFee === "HIGH"}
                onChange={() => setTXFee("HIGH")}
              />
              <label htmlFor="high" className="pl-1">
                High
              </label>
            </div>
          </div>
        </div>

        <div className="modal-action pt-4">
          <button className="btn" onClick={closeDialog}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onCreateTransactionClicked} disabled={!isValidForm()}>
            Create Tx
          </button>
        </div>
      </div>
    </div>
  );
};
