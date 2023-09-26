import React from "react";
import { IAssetAddress, IAssetBalance, IWalletAsset } from "../services/ApiService";
import { Copyable } from "./ui/Copyable";
import { IAssetInfo } from "../IAppState";

interface IProps {
  assetInfo: IAssetInfo;
}

export const AssetRow: React.FC<IProps> = ({ assetInfo }) => {
  const { asset, address, balance } = assetInfo;

  if (!asset.id) {
    return null;
  }

  const { id, name, type } = asset;
  return (
    <tr key={id}>
      <td>{id}</td>
      <td>{name}</td>
      <td>{type}</td>
      <td>{address && <Copyable value={address.address} />}</td>
      <td>{balance && balance.total}</td>
    </tr>
  );
};
