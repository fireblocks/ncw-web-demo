import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";
import { AreYouSureDialog } from "./ui/AreYouSureDialog";

const uuidRegex = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', 'i');

export const AssignDevice: React.FC = () => {
  const {
    walletId,
    deviceId,
    setDeviceId,
    assignDeviceStatus,
    automateInitialization,
    assignCurrentDevice,
    generateNewDeviceId,
    fireblocksNCW,
  } = useAppStore();
  const [isAreYouSureDialogOpen, setIsAreYouSureDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (automateInitialization && !walletId) {
      assignCurrentDevice();
    }
  }, [automateInitialization, walletId]);

  const onGenerateNewDeviceIdClicked = () => {
    setIsAreYouSureDialogOpen(true);
  };

  const closeAreYouSureDialog = () => {
    setIsAreYouSureDialogOpen(false);
  };

  const onGenerateNewDeviceIdApproved = async () => {
    setIsAreYouSureDialogOpen(false);
    if (fireblocksNCW) {
      await fireblocksNCW.clearAllStorage();
    }
    generateNewDeviceId();
  };

  const isValidDeviceId = uuidRegex.test(deviceId);

  const generateNewDeviceIdAction: ICardAction = {
    action: onGenerateNewDeviceIdClicked,
    isDisabled: assignDeviceStatus === "started" || !walletId,
    label: "Generate new Device ID",
  };

  const assignDeviceAction: ICardAction = {
    action: assignCurrentDevice,
    isDisabled: assignDeviceStatus !== "not_started" || !isValidDeviceId,
    isInProgress: assignDeviceStatus === "started",
    label: "Assign Device",
  };

  return (
    <>
      <Card title="Device ID" actions={[assignDeviceAction, generateNewDeviceIdAction]}>
        <div className="grid grid-cols-[150px_auto] gap-2">
          <label className="label">
            <span className="label-text">Device ID:</span>
          </label>
          <input
            type="text"
            disabled={!!walletId}
            value={deviceId}
            className="input input-bordered"
            onChange={(e) => setDeviceId(e.target.value)}
          />
        </div>
        {walletId && (
          <div className="mockup-code">
            <pre>
              <code>Wallet ID: {walletId}</code>
            </pre>
          </div>
        )}
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
      <AreYouSureDialog
        title="Are you sure?"
        isOpen={isAreYouSureDialogOpen}
        onYes={onGenerateNewDeviceIdApproved}
        onNo={closeAreYouSureDialog}
      >
        <div className="alert alert-error mt-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="flex-1">Warning: All data will be lost!!</span>
        </div>
      </AreYouSureDialog>
    </>
  );
};
