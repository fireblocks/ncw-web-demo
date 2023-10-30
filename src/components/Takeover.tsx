import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";
import { IFullKey } from "@fireblocks/ncw-js-sdk";
import { Copyable } from "./ui/Copyable";
import { ExportFullKeysDialog } from "./ui/ExportFullKeysDialog";
import { DeriveAssetKeysDialog } from "./ui/DeriveAssetKeysDialog";

export const Takeover: React.FC = () => {
  const { takeover, exportFullKeys } = useAppStore();
  const [isTakeoverInProgress, setIsTakeoverInProgress] = React.useState(false);
  const [isExportInProgress, setIsExportInProgress] = React.useState(false);
  const [isExportFullKeysDialogOpen, setIsExportFullKeysDialogOpen] = React.useState(false);
  const [isDeriveAssetKeysDialogOpen, setIsDeriveAssetKeysDialogOpen] = React.useState(false);
  const [exportedFullKeys, setExportedFullKeys] = React.useState<IFullKey[] | null>(null);

  const onTakeoverClicked = async () => {
    try {
      setIsTakeoverInProgress(true);
      const result = await takeover();
      setExportedFullKeys(result);
    } finally {
      setIsTakeoverInProgress(false);
    }
  };

  const doExportFullKeys = async (chainCode: string, cloudKeyShares: Map<string, string[]>) => {
    try {
      setIsExportFullKeysDialogOpen(false);
      setIsExportInProgress(true);
      const result = await exportFullKeys(chainCode, cloudKeyShares);
      setExportedFullKeys(result);
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

  const takeoverAction: ICardAction = {
    action: onTakeoverClicked,
    label: "Takeover",
    isDisabled: isTakeoverInProgress || isExportInProgress,
    isInProgress: isTakeoverInProgress,
  };

  const exportFullKeysAction: ICardAction = {
    action: onExportFullKeysClicked,
    label: "Export FullKeys",
    isDisabled: isTakeoverInProgress || isExportInProgress,
    isInProgress: isExportInProgress,
  };

  const deriveAssetKeysAction: ICardAction = {
    action: onDeriveAssetKeysClicked,
    label: "Derive Asset Keys",
    isDisabled: isTakeoverInProgress || isExportInProgress,
    isInProgress: isExportInProgress,
  };

  const closeExportFullKeysDialog = () => {
    setIsExportFullKeysDialogOpen(false);
  };

  const closeDeriveAssetKeysDialog = () => {
    setIsDeriveAssetKeysDialogOpen(false);
  };

  return (
    <Card title="Takeover" actions={[takeoverAction, exportFullKeysAction, deriveAssetKeysAction]}>
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
    </Card>
  );
};
