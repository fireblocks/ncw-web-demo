import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";

export const Takeover: React.FC = () => {
  const { takeover } = useAppStore();

  const onTakeoverClicked = async () => {
    await takeover();
  };

  const takeoverAction: ICardAction = {
    action: onTakeoverClicked,
    label: "Takeover",
  };

  return <Card title="Takeover" actions={[takeoverAction]}></Card>;
};
