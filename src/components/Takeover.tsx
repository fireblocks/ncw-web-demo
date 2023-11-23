import { IFullKey } from "@fireblocks/ncw-js-sdk";
import React from "react";
import { useAppStore } from "../AppStore";
import { IActionButtonProps } from "./ui/ActionButton";
import { Card } from "./ui/Card";
import { Copyable } from "./ui/Copyable";
import { DeriveAssetKeysDialog } from "./ui/DeriveAssetKeysDialog";
import { ErrorToast } from "./ui/ErrorToast";
import { ExportFullKeysDialog } from "./ui/ExportFullKeysDialog";

export const Takeover: React.FC = () => {
  const { takeover, exportFullKeys } = useAppStore();
  const [isTakeoverInProgress, setIsTakeoverInProgress] = React.useState(false);
  const [isExportInProgress, setIsExportInProgress] = React.useState(false);
  const [isExportFullKeysDialogOpen, setIsExportFullKeysDialogOpen] = React.useState(false);
  const [isDeriveAssetKeysDialogOpen, setIsDeriveAssetKeysDialogOpen] = React.useState(false);
  const [exportedFullKeys, setExportedFullKeys] = React.useState<IFullKey[] | null>(null);
  const [errorStr, setErrorStr] = React.useState<string | null>(null);

  const onTakeoverClicked = async () => {
    try {
      setErrorStr(null);
      setIsTakeoverInProgress(true);
      const result = await takeover();
      setExportedFullKeys(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorStr(err.message);
      } else {
        setErrorStr("Unknown error");
      }
    } finally {
      setIsTakeoverInProgress(false);
    }
  };

  const doExportFullKeys = async (chainCode: string, cloudKeyShares: Map<string, string[]>) => {
    try {
      setErrorStr(null);
      setIsExportFullKeysDialogOpen(false);
      setIsExportInProgress(true);
      const result = await exportFullKeys(chainCode, cloudKeyShares);
      setExportedFullKeys(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorStr(err.message);
      } else {
        setErrorStr("Unknown error");
      }
    } finally {
      setIsExportInProgress(false);
    }
  };

  const onExportFullKeysClicked = () => {
    setIsExportFullKeysDialogOpen(true);
  };

  const onDeriveAssetKeysClicked = () => {
    setIsDeriveAssetKeysDialogOpen(true);
  };

  const onClearDataClicked = () => {
    setExportedFullKeys(null);
  };

  const takeoverAction: IActionButtonProps = {
    action: onTakeoverClicked,
    label: "Takeover",
    isDisabled: isTakeoverInProgress || isExportInProgress,
    isInProgress: isTakeoverInProgress,
  };

  const exportFullKeysAction: IActionButtonProps = {
    action: onExportFullKeysClicked,
    label: "Export FullKeys",
    isDisabled: isTakeoverInProgress || isExportInProgress,
    isInProgress: isExportInProgress,
  };

  const deriveAssetKeysAction: IActionButtonProps = {
    action: onDeriveAssetKeysClicked,
    label: "Derive Asset Keys",
    isDisabled: isTakeoverInProgress || isExportInProgress,
    isInProgress: isExportInProgress,
  };

  const clearDataAction: IActionButtonProps = {
    action: onClearDataClicked,
    label: "Clear",
    isDisabled: isTakeoverInProgress || isExportInProgress || !exportedFullKeys,
  };

  const closeExportFullKeysDialog = () => {
    setIsExportFullKeysDialogOpen(false);
  };

  const closeDeriveAssetKeysDialog = () => {
    setIsDeriveAssetKeysDialogOpen(false);
  };

  return (
    <Card title="Takeover" actions={[takeoverAction, exportFullKeysAction, deriveAssetKeysAction, clearDataAction]}>
      {exportedFullKeys && (
        <div>
          {exportedFullKeys.map((key) => {
            return (
              <div key={key.keyId} className="grid grid-cols-[100px_400px] gap-2">
                <strong>Algorithm:</strong> {key.algorithm}
                <strong>KeyId:</strong> {key.keyId}
                <strong>PrivateKey:</strong>
                <Copyable value={key.privateKey} />
                <strong>PublicKey:</strong> <Copyable value={key.publicKey} />
              </div>
            );
          })}
        </div>
      )}
      <ExportFullKeysDialog
        isOpen={isExportFullKeysDialogOpen}
        onClose={closeExportFullKeysDialog}
        onExport={doExportFullKeys}
      />
      <DeriveAssetKeysDialog isOpen={isDeriveAssetKeysDialogOpen} onClose={closeDeriveAssetKeysDialog} />
      <ErrorToast errorStr={errorStr} />
    </Card>
  );
};
