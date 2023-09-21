import React from "react";
import { TokenGetterContext } from "./TokenGetterProvider";

export function useAccessTokenGetter(): () => Promise<string> {
  const contextValue = React.useContext<(() => Promise<string>) | null>(TokenGetterContext);
  if (contextValue === null) {
    throw new Error("You must use TokenProvider to be able to get the access token");
  }
  return contextValue;
}
