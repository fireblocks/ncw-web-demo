import React from "react";
import { useAppStore } from "../AppStore";
import { IAssetAddress, IAssetBalance, IWalletAsset } from "../services/ApiService";

interface IProps {
  asset: IWalletAsset;
  balance?: IAssetBalance,
  address?: IAssetAddress,
}

export const AssetRow: React.FC<IProps> = ({ asset, balance, address }) => {
  const isMountedRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (!asset.id) {
    return null;
  }

  const { id, name, type } = asset;
  return (
    <tr key={id}>
      <td>{id}</td>
      <td>{name}</td>
      <td>{type}</td>
      <td>{address && address.address}</td>
      <td>{balance && balance.total}</td>
    </tr>
  );
};
