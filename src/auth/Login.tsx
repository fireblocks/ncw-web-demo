import { getAuth, GoogleAuthProvider, signInWithPopup } from "@firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { Card, ICardAction } from "../components/ui/Card";
import { ReactFCC } from "../types";
import { TokenProvider } from "./TokenProvider";
import { useFirebaseApp } from "./firebaseAppHook";

export const Login: ReactFCC = ({ children }) => {
  const firebaseApp = useFirebaseApp();
  const auth = getAuth(firebaseApp);
  const [user, loading] = useAuthState(auth);

  if (user) {
    return <TokenProvider>{children}</TokenProvider>;
  }

  const cardAction: ICardAction = {
    action: () => signInWithPopup(auth, new GoogleAuthProvider()),
    isDisabled: loading,
    isInProgress: loading,
    label: "Login",
  };
  return (
    <div className="mt-16">
      <Card title="Authentication" actions={[cardAction]}>
        {loading ? <p>Please wait...</p> : <p>You must first login to be able to access the demo application</p>}
      </Card>
    </div>
  );
};
