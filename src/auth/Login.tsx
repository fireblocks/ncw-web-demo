import { getAuth, GoogleAuthProvider, OAuthCredential, OAuthProvider, PopupRedirectResolver, signInWithPopup } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { Card, ICardAction } from "../components/ui/Card";
import { ReactFCC } from "../types";
import { TokenGetterProvider } from "./TokenGetterProvider";
import { useFirebaseApp } from "./firebaseAppHook";
import { GoogleDriveProvider } from "./providers";
import { useState } from "react";

export const Login: ReactFCC = ({ children }) => {
  const firebaseApp = useFirebaseApp();
  const auth = getAuth(firebaseApp);
  const [user, loading] = useAuthState(auth);

  if (user) {
    return <TokenGetterProvider>{children}</TokenGetterProvider>;
  }

  const goolgeLogin  = async () => {
    const result = await signInWithPopup(auth, GoogleDriveProvider);
  }

  const appleLogin  = async () => {
    const result = await signInWithPopup(auth, new OAuthProvider('apple.com'));
  }

  const googleCardAction: ICardAction = {
    action: goolgeLogin,
    isDisabled: loading,
    isInProgress: loading,
    label: "Sign In With Google",
  };

  const appleCardAction: ICardAction = {
    action: appleLogin,
    isDisabled: loading,
    isInProgress: loading,
    label: "Sign In With Apple",
  };

  return (
    <div className="mt-16">
      <Card title="Authentication" actions={[googleCardAction, appleCardAction]}>
        {loading ? <p>Please wait...</p> : <p>You must first login to be able to access the demo application</p>}
      </Card>
    </div>
  );
};
