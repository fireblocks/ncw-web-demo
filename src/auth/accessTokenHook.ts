import React from "react";
import { TokenContext } from "./TokenProvider";

export function useAccessToken(): string {
  const contextValue = React.useContext<string | null>(TokenContext);
  if (contextValue === null) {
    throw new Error("You must use TokenProvider to be able to get the access token");
  }
  return contextValue;
}
