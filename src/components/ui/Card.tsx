import React from "react";

export interface ICardAction {
  action?: () => void;
  isDisabled?: boolean;
  isInProgress?: boolean;
  buttonVariant?: "primary" | "accent";
  label: string;
}

interface IProps {
  title: string;
  children?: React.ReactNode;
  actions?: ICardAction[];
}

const CardActionButton: React.FC<ICardAction> = ({
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

export const Card: React.FC<IProps> = ({ title, children, actions = [] }) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        {children}
        <div className="card-actions">
          {actions.map((action) => (
            <CardActionButton key={action.label} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
};
