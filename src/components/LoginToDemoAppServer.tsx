import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";

export const LoginToDemoAppServer: React.FC = () => {
  const { userId, loginToDemoAppServerStatus, automateInitialization, loginToDemoAppServer } = useAppStore(
    (appStore) => ({
      userId: appStore.userId,
      loginToDemoAppServerStatus: appStore.loginToDemoAppServerStatus,
      automateInitialization: appStore.automateInitialization,
      loginToDemoAppServer: appStore.loginToDemoAppServer,
    }),
  );

  React.useEffect(() => {
    if (automateInitialization && userId === null) {
      loginToDemoAppServer();
    }
  }, [loginToDemoAppServer, automateInitialization, userId]);

  const cardAction: ICardAction = {
    action: loginToDemoAppServer,
    isDisabled: loginToDemoAppServerStatus === "started" || !!userId,
    isInProgress: loginToDemoAppServerStatus === "started",
    label: "Login to the Demo App Server",
  };

  return (
    <Card title="Login" actions={[cardAction]}>
      {userId && (
        <div className="mockup-code">
          <pre>
            <code>User ID: {userId}</code>
          </pre>
        </div>
      )}
    </Card>
  );
};
