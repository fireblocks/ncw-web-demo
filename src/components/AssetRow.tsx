import React from "react";
import { Copyable } from "./ui/Copyable";
import { IAssetInfo } from "../IAppState";

interface IProps {
  assetInfo: IAssetInfo;
}

export const missingIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
</svg>


export const AssetRow: React.FC<IProps> = ({ assetInfo }) => {
  const { asset, address, balance } = assetInfo;

  if (!asset.id) {
    return null;
  }

  const { id, name, type, iconUrl } = asset;
  return (
    <tr key={id}>
      <td>{iconUrl ? <img width={32} height={32} src={iconUrl}></img> : missingIcon}</td>
      <td>{id}</td>
      <td>{name}</td>
      <td>{type}</td>
      <td>{address && <Copyable value={address.address} />}</td>
      <td>{balance && balance.total}</td>
    </tr>
  );
};
