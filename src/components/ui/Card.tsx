import React from "react";
import { ActionButton, IActionButtonProps } from "./ActionButton";

interface IProps {
  title: string;
  children?: React.ReactNode;
  actions?: IActionButtonProps[];
}

export const Card: React.FC<IProps> = ({ title, children, actions = [] }) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        {children}
        <div className="card-actions">
          {actions.map((action) => (
            <ActionButton key={action.label} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
};
