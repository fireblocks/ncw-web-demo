import { getAuth } from "@firebase/auth";
import React, { createContext } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useFirebaseApp } from "./firebaseAppHook";

export const TokenContext = createContext<string | null>(null);

interface IProps {
  children?: React.ReactNode;
}

export const TokenProvider: React.FC<IProps> = ({ children }) => {
  const firebaseApp = useFirebaseApp();
  const auth = getAuth(firebaseApp);
  const [user] = useAuthState(auth);
  const [isGettingAccessToken, setIsGettingAccessToken] = React.useState(false);
  const [token, setToken] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    let isMounted = true;
    const getToken = async () => {
      setIsGettingAccessToken(true);
      const token = await user!.getIdToken();
      if (!isMounted) {
        return;
      }

      setToken(token);
      setIsGettingAccessToken(false);
    };

    getToken();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isGettingAccessToken) {
    return <div>Getting access token...</div>;
  }

  if (!token) {
    return null;
  }

  return <TokenContext.Provider value={token}>{children}</TokenContext.Provider>;
};
