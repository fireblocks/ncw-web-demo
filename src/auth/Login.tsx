import { getAuth, GoogleAuthProvider, signInWithPopup } from "@firebase/auth";
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

  const cardAction: ICardAction = {
    action: () => signInWithPopup(auth, new GoogleAuthProvider()),
    isDisabled: loading,
    isInProgress: loading,
    label: "Login With Google",
  };
  return (
    <div className="mt-16">
      <Card title="Authentication" actions={[cardAction]}>
        {loading ? <p>Please wait...</p> : <p>You must first login to be able to access the demo application</p>}
      </Card>
    </div>
  );
};
