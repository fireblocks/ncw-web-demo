import React from "react";

export const ArrayOfBytes: React.FC<{ arr: string }> = ({ arr }) => {
  const items = arr.toUpperCase();
  return <span>[{items}]</span>;
};
