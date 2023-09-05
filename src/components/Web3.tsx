import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";
import { Web3ConnectionRow } from "./Web3ConnectionRow";

export const Web3: React.FC = () => {
  const {
    getWeb3Connections,
    web3Connections,
    createWeb3Connection,
    web3Uri,
    setWeb3uri,
    pendingWeb3Connection,
    approveWeb3Connection,
    denyWeb3Connection,
  } = useAppStore();

  const onRefreshClicked = async () => {
    await getWeb3Connections();
  };

  const refeshAction: ICardAction = {
    action: onRefreshClicked,
    label: "Refresh",
  };

  const onCreateConnection = async () => {
    if (web3Uri) {
      await createWeb3Connection(web3Uri);
      setWeb3uri(null);
    }
  };

  const onApproveConnection = async () => {
    if (pendingWeb3Connection) {
      await approveWeb3Connection();
      await getWeb3Connections();
    }
  };

  const onDenyConnection = async () => {
    if (pendingWeb3Connection) {
      await denyWeb3Connection();
    }
  };

  const hasConnections = web3Connections.length > 0;
  return (
    <Card title="Web3" actions={[refeshAction]}>
      <div className="grid grid-cols-[150px_auto_100px] gap-2">
        <label className="label">
          <span className="label-text">Uri:</span>
        </label>
        <input type="text" className="input input-bordered" value={web3Uri ?? ""} onChange={(e) => setWeb3uri(e.currentTarget.value)} />
        <button
          className="btn btn-secondary"
          onClick={onCreateConnection}
          disabled={!web3Uri || web3Uri.trim().length === 0}
        >
          Connect
        </button>
      </div>
      <div className="overflow-x-auto">
        {pendingWeb3Connection && (
          <div className="grid grid-cols-[auto_100px_100px] gap-2">
            <label className="label">
              <span className="label-text">Allow connection to: <b>{pendingWeb3Connection.sessionMetadata.appName} ({pendingWeb3Connection.sessionMetadata.appUrl})</b>?</span>
            </label>
            <button className="btn btn-approve-web3 btn-primary" onClick={onApproveConnection}>
              Approve
            </button>
            <button className="btn btn-deby-web3 btn-secondary" onClick={onDenyConnection}>
              Deny
            </button>
          </div>
        )}

        {hasConnections && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Url</th>
                <th>Icon</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {web3Connections.map((session) => (
                <Web3ConnectionRow key={session.id} session={session} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};
