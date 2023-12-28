import React from "react";
import { useAppStore } from "../AppStore";
import { Card } from "./ui/Card";
import { validateGuid } from "./validateGuid";
import { IActionButtonProps } from "./ui/ActionButton";
import { Copyable } from "./ui/Copyable";

export const AssignDevice: React.FC = () => {
  const {
    walletId,
    deviceId,
    setDeviceId,
    setWalletId,
    askToJoinWalletExisting,
    assignDeviceStatus,
    joinWalletStatus,
    automateInitialization,
    assignCurrentDevice,
    generateNewDeviceId,
    appMode,
  } = useAppStore();

  React.useEffect(() => {
    if (automateInitialization && !walletId) {
      assignCurrentDevice();
    }
  }, [automateInitialization, walletId]);

  React.useEffect(() => {
    if (appMode === "JOIN") {
      generateNewDeviceId();
    }
  }, [appMode]);

  const isValidDeviceId = validateGuid(deviceId);
  const isValidWalletId = validateGuid(walletId);

  const blockActions = React.useMemo(() => {
    if (appMode === "SIGN_IN") {
      return assignDeviceStatus === "started" || assignDeviceStatus === "success";
    } else {
      return joinWalletStatus === "started";
    }
  }, [appMode, assignDeviceStatus, joinWalletStatus]);

  const generateNewDeviceIdAction: IActionButtonProps = {
    action: generateNewDeviceId,
    isDisabled: assignDeviceStatus === "started" || joinWalletStatus === "started",
    label: "Generate new Device ID",
  };

  const assignDeviceAction: IActionButtonProps = {
    action: assignCurrentDevice,
    isDisabled: blockActions || !isValidDeviceId,
    isInProgress: assignDeviceStatus === "started",
    label: "Assign Device",
  };

  const joinWalletAction: IActionButtonProps = {
    action: askToJoinWalletExisting,
    isDisabled: blockActions || !isValidWalletId,
    isInProgress: assignDeviceStatus === "started",
    label: "Join Existing Wallet",
  };

  return (
    <Card
      title="Device ID"
      actions={[generateNewDeviceIdAction, appMode === "SIGN_IN" ? assignDeviceAction : joinWalletAction]}
    >
      <div className="grid grid-cols-[150px_auto_20px] gap-2 mb-4">
        <label className="label">
          <span className="label-text">Device ID:</span>
        </label>
        <input
          type="text"
          disabled={blockActions}
          value={deviceId ?? ""}
          className="input input-bordered"
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="Device id"
        />
        {deviceId ? <Copyable value={deviceId} /> : <span />}
        <label className="label">
          <span className="label-text">Wallet ID:</span>
        </label>
        <input
          type="text"
          disabled={blockActions}
          value={walletId ?? ""}
          className="input input-bordered"
          onChange={(e) => setWalletId(e.target.value)}
          placeholder="Wallet id"
        />
        {walletId ? <Copyable value={walletId} /> : <span />}
      </div>
      {assignDeviceStatus === "failed" && (
        <div className="alert alert-error shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Unable to assign device</span>
          </div>
        </div>
      )}
    </Card>
  );
};
