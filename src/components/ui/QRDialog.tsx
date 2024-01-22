import React from "react";
import QRCode from "react-qr-code";

interface IProps {
  qrCodeValue: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QRDialog: React.FC<IProps> = ({ isOpen, onClose, qrCodeValue }) => {
  let modalClassName = "modal modal-bottom sm:modal-middle";
  if (isOpen) {
    modalClassName += " modal-open";
  }

  return (
    <div className={modalClassName}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Scan with mobile device</h3>
        <div className="pt-6 flex items-center justify-center">
          <QRCode value={qrCodeValue} style={{ width: "350px", height: "350px" }} />
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
