import { FirebaseApp } from "@firebase/app";
import React from "react";
import { FirebaseAppProviderContext } from "./FirebaseAppProvider";

export function useFirebaseApp(): FirebaseApp {
  const contextValue = React.useContext<FirebaseApp | null>(FirebaseAppProviderContext);
  if (contextValue === null) {
    throw new Error("You must use FirebaseAppProvider to be able to get the firebase app");
  }
  return contextValue;
}
