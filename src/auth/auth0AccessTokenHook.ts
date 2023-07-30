import React from "react";
import { Auth0TokenContext } from "./Auth0TokenProvider";

export function useAuth0AccessToken(): string {
  const contextValue = React.useContext<string | null>(Auth0TokenContext);
  if (contextValue === null) {
    throw new Error("You must use Auth0TokenProvider to be able to get the access token");
  }
  return contextValue;
}
