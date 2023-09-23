import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { Card, ICardAction } from "../components/ui/Card";
import { ReactFCC } from "../types";
import { TokenGetterProvider } from "./TokenGetterProvider";
import { useFirebaseApp } from "./firebaseAppHook";

export const Login: ReactFCC = ({ children }) => {
  const firebaseApp = useFirebaseApp();
  const auth = getAuth(firebaseApp);
  const [user, loading] = useAuthState(auth);

  if (user) {
    return <TokenGetterProvider>{children}</TokenGetterProvider>;
  }

  const googleCardAction: ICardAction = {
    action: () => signInWithPopup(auth, new GoogleAuthProvider()),
    isDisabled: loading,
    isInProgress: loading,
    label: "Sign In With Google",
  };

  const appleCardAction: ICardAction = {
    action: () => signInWithPopup(auth, new OAuthProvider('apple.com')),
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
