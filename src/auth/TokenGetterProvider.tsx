import { getAuth } from "firebase/auth";
import React, { createContext } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useFirebaseApp } from "./firebaseAppHook";

export const TokenGetterContext = createContext<(() => Promise<string>) | null>(null);

interface IProps {
  children?: React.ReactNode;
}

export const TokenGetterProvider: React.FC<IProps> = ({ children }) => {
  const firebaseApp = useFirebaseApp();
  const auth = getAuth(firebaseApp);
  const [user] = useAuthState(auth);

  return <TokenGetterContext.Provider value={() => user!.getIdToken()}>{children}</TokenGetterContext.Provider>;
};
