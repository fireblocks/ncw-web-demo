import { useAuth0 } from "@auth0/auth0-react";
import React, { createContext } from "react";

export const Auth0TokenContext = createContext<string | null>(null);

interface IProps {
  children?: React.ReactNode;
}

export const Auth0TokenProvider: React.FC<IProps> = ({ children }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [isGettingAccessToken, setIsGettingAccessToken] = React.useState(false);
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const getToken = async () => {
      setIsGettingAccessToken(true);
      const token = await getAccessTokenSilently();
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
  }, [getAccessTokenSilently]);

  if (isGettingAccessToken) {
    return <div>Getting access token...</div>;
  }

  if (!token) {
    return null;
  }

  return <Auth0TokenContext.Provider value={token}>{children}</Auth0TokenContext.Provider>;
};
