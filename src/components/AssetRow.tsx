import React from "react";
import { Copyable } from "./ui/Copyable";
import { IAssetInfo } from "../IAppState";
import { missingIcon } from "../icons/missingIcon";

interface IProps {
  assetInfo: IAssetInfo;
}

export const AssetRow: React.FC<IProps> = ({ assetInfo }) => {
  const { asset, address, balance } = assetInfo;

  if (!asset.id) {
    return null;
  }

  const { id, name, type, iconUrl } = asset;
  return (
    <tr key={id}>
      <td className="px-1">
        <div className="flex gap-2 items-center">
          <span className="w-5">{iconUrl ? <img src={iconUrl} width={32} height={32}></img> : missingIcon}</span>
          <span>{id}</span>
        </div>
      </td>
      <td className="px-1 text-ellipsis overflow-hidden whitespace-nowrap">{name}</td>
      <td className="px-1">{type}</td>
      <td className="px-1">{address && <Copyable value={address.address} />}</td>
      <td className="px-1">{balance && balance.total}</td>
    </tr>
  );
};
