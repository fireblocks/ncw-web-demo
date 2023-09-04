import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";
import { Web3ConnectionRow } from "./Web3ConnectionRow";

export const Web3: React.FC = () => {
  const { getWeb3Connections, web3Connections } = useAppStore();

  const onRefreshClicked = async () => {
    await getWeb3Connections();
  };

  const refeshAction: ICardAction = {
    action: onRefreshClicked,
    label: "Refresh",
  };

  const connectAction: ICardAction = {
    action: onRefreshClicked,
    label: "Connect uri",
  };

  return (
    <Card title="Web3" actions={[connectAction, refeshAction]}>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Session Id</th>
              <th>dapp</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {web3Connections.map((session) => (
              <Web3ConnectionRow key={session.id} session={session} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
