import { useAuth0 } from "@auth0/auth0-react";
import { Card, ICardAction } from "../components/ui/Card";
import { ReactFCC } from "../types";
import { Auth0TokenProvider } from "./Auth0TokenProvider";

export const Auth0Login: ReactFCC = ({ children }) => {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();

  if (isAuthenticated) {
    return <Auth0TokenProvider>{children}</Auth0TokenProvider>;
  }

  const cardAction: ICardAction = {
    action: loginWithRedirect,
    isDisabled: isLoading,
    isInProgress: isLoading,
    label: "Login",
  };
  return (
    <div className="mt-16">
      <Card title="Authentication" actions={[cardAction]}>
        {isLoading ? <p>Please wait...</p> : <p>You must first login to be able to access the demo application</p>}
      </Card>
    </div>
  );
};
