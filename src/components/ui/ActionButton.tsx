import React from "react";

export interface IActionButtonProps {
  action?: () => void;
  isDisabled?: boolean;
  isInProgress?: boolean;
  buttonVariant?: "primary" | "accent";
  label: string;
}

export const ActionButton: React.FC<IActionButtonProps> = ({
  action,
  isDisabled = false,
  isInProgress = false,
  buttonVariant = "primary",
  label,
}) => {
  const buttonClassName = buttonVariant === "primary" ? "btn btn-primary" : "btn btn-accent";
  return (
    <button className={buttonClassName} disabled={isDisabled} onClick={action}>
      {isInProgress && <span className="loading loading-spinner">x</span>}
      {label}
    </button>
  );
};
