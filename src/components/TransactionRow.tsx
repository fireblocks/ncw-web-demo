import React from "react";
import { useAppStore } from "../AppStore";
import { ITransactionData } from "../services/ApiService";

interface IProps {
  tx: ITransactionData;
}

export const TransactionRow: React.FC<IProps> = ({ tx }) => {
  const { fireblocksNCW } = useAppStore();
  const isMountedRef = React.useRef<boolean>(false);
  const [inProgress, setInProgress] = React.useState<boolean>(false);
  const [errorStr, setErrorStr] = React.useState<string | null>(null);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const onSignTransactionClicked = async (txId: string) => {
    if (!fireblocksNCW) {
      return;
    }

    setInProgress(true);
    try {
      await fireblocksNCW.signTransaction(txId);
    } catch (err: unknown) {
      setInProgress(false);
      setTimeout(() => {
        if (isMountedRef.current) {
          setErrorStr(null);
        }
      }, 10000);

      if (err instanceof Error) {
        setErrorStr(err.message);
      } else {
        setErrorStr("Unknown error");
      }
    }
  };

  const label = inProgress ? "Signing..." : "Sign";

  return (
    <tr key={tx.id}>
      <td>{tx.id}</td>
      <td>{tx.status}</td>
      <td>
        {tx.status === "PENDING_SIGNATURE" ? (
          <button
            className="btn btn-sm btn-secondary"
            disabled={inProgress}
            onClick={() => onSignTransactionClicked(tx.id)}
          >
            {label}
          </button>
        ) : null}
        {errorStr ? (
          <div className="toast">
            <div className="alert alert-error">
              <span>{errorStr}</span>
            </div>
          </div>
        ) : null}
      </td>
    </tr>
  );
};
