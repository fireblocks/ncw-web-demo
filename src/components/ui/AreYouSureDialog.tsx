import React from "react";

interface IProps {
  title: string;
  isOpen: boolean;
  children?: React.ReactNode;
  onYes: () => void;
  onNo: () => void;
}

export const AreYouSureDialog: React.FC<IProps> = ({ title, children, onYes, onNo, isOpen }) => {
  let modalClassName = "modal modal-bottom sm:modal-middle";
  if (isOpen) {
    modalClassName += " modal-open";
  }
  return (
    <div className={modalClassName}>
      <div className="modal-box">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onNo}>
          ✕
        </button>
        <h3 className="font-bold text-lg">{title}</h3>
        {children}
        <div className="modal-action">
          <button className="btn btn-primary" onClick={onYes}>
            Yes
          </button>
          <button className="btn" onClick={onNo}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};
