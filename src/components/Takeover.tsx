import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";

export const Takeover: React.FC = () => {
  const { takeover } = useAppStore();
  const [isInProgress, setIsInProgress] = React.useState(false);

  const onTakeoverClicked = async () => {
    try {
      setIsInProgress(true);
      await takeover();
    } finally {
      setIsInProgress(false);
    }
  };

  const takeoverAction: ICardAction = {
    action: onTakeoverClicked,
    label: "Takeover",
    isDisabled: isInProgress,
    isInProgress: isInProgress,
  };

  return <Card title="Takeover" actions={[takeoverAction]}></Card>;
};
