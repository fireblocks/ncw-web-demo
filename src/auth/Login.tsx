import { GoogleAuthProvider } from "firebase/auth";
import { useAppStore } from "../AppStore";
import { IActionButtonProps } from "../components/ui/ActionButton";
import { Card } from "../components/ui/Card";
import { ReactFCC } from "../types";

export const Login: ReactFCC = ({ children }) => {
  const { login } = useAppStore();

  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });

  const googleCardAction: IActionButtonProps = {
    action: () => login("GOOGLE"),
    label: "Sign In With Google",
  };

  const appleCardAction: IActionButtonProps = {
    action: () => login("APPLE"),
    label: "Sign In With Apple",
  };

  return (
    <div className="mt-16">
      <Card title="Authentication" actions={[googleCardAction, appleCardAction]}>
        <p>You must first login to be able to access the demo application</p>
      </Card>
    </div>
  );
};
