import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";
import { Web3ConnectionRow } from "./Web3ConnectionRow";

export const Web3: React.FC = () => {
  const { getWeb3Connections, web3Connections, createWeb3Connection, web3Uri, setWeb3uri } = useAppStore();

  const onRefreshClicked = async () => {
    await getWeb3Connections();
  };

  const refeshAction: ICardAction = {
    action: onRefreshClicked,
    label: "Refresh",
  };

  const onConnectDapp = async () => {
    if (web3Uri) {
      await createWeb3Connection(web3Uri);
      setWeb3uri(null);
    }
  }

  return (
    <Card title="Web3" actions={[refeshAction]}>
      <div className="grid grid-cols-[150px_auto_50px] gap-2">
        <label className="label">
          <span className="label-text">Uri:</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          onChange={(e) => setWeb3uri(e.currentTarget.value)}
        />
        <button className="btn btn-connect-dapp" onClick={() => onConnectDapp()} />
      </div>

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
