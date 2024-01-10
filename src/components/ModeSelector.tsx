import { useAppStore } from "../AppStore";
import { IActionButtonProps } from "../components/ui/ActionButton";
import { Card } from "../components/ui/Card";
import { ReactFCC } from "../types";

export const ModeSelector: ReactFCC = () => {
  const { setAppMode, appMode } = useAppStore();

  const signIn: IActionButtonProps = {
    action: () => {
      setAppMode("SIGN_IN");
    },
    label: "Sign into your wallet or create a new wallet",
    buttonVariant: appMode === "SIGN_IN" ? "accent" : "primary",
  };

  const join: IActionButtonProps = {
    action: () => {
      setAppMode("JOIN");
    },
    label: "Join existing wallet",
    buttonVariant: appMode === "JOIN" ? "accent" : "primary",
  };

  return (
    <div>
      <Card title="Mode selector" actions={[signIn, join]}>
        <p>Select web demo app mode</p>
      </Card>
    </div>
  );
};
