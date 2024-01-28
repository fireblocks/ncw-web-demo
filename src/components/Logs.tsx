import React from "react";

import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";

export const Logs: React.FC = () => {
  const { collectLogs, clearLogs, countLogs } = useAppStore();
  const collectLogsAction: ICardAction = {
    label: "Collect Logs",
    action: collectLogs,
  };
  const clearLogsAction: ICardAction = {
    label: "Clear Logs",
    action: clearLogs,
  };
  const countLogsAction: ICardAction = {
    label: "Count Logs",
    action: countLogs,
  };
  return <Card title="Logs" actions={[collectLogsAction, clearLogsAction, countLogsAction]}></Card>;
};
