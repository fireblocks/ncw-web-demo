import React from "react";
import { useAppStore } from "../AppStore";
import { ITransactionData, ITransactionDetails, TTransactionStatus } from "../services/ApiService";

interface IProps {
  tx: ITransactionData;
}

const formatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
})

const DIVISIONS: { amount: number, name: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, name: "seconds" },
  { amount: 60, name: "minutes" },
  { amount: 24, name: "hours" },
  { amount: 7, name: "days" },
  { amount: 4.34524, name: "weeks" },
  { amount: 12, name: "months" },
  { amount: Number.POSITIVE_INFINITY, name: "years" },
]

function formatTimeAgo(date: Date) {
  let duration = (date.valueOf() - new Date().valueOf()) / 1000

  for (let i = 0; i < DIVISIONS.length; i++) {
    const division = DIVISIONS[i]
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name)
    }
    duration /= division.amount
  }
}

function statusColor(status: TTransactionStatus) {
  switch (status) {
    case "PENDING_SIGNATURE":
      return "text-warning";
    case "COMPLETED":
      return "text-success";
    case "FAILED":
    case "CANCELLED":
      return "text-error";
    default:
      return "text-info";
  }
}

export const TransactionRow: React.FC<IProps> = ({ tx }) => {
  const { fireblocksNCW, walletId } = useAppStore();
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
  const isOutgoing = (tx: ITransactionDetails) => 
    tx.source.walletId === walletId;

  return (
    <tr key={tx.id}>
      <td>{tx.id}</td>
      <td>{formatTimeAgo(new Date(tx.createdAt!))}</td>
      <td>{tx.details?.assetId}</td>
      <td>{tx.details?.operation}</td>
      <td><div className={statusColor(tx.status)}>{tx.status}</div></td>
      <td>{tx.details && isOutgoing(tx.details) ? 
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg> :
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
        </svg>
      }</td>
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
          <div className="toast toast-container">
            <div className="alert alert-error">
              <span>{errorStr}</span>
            </div>
          </div>
        ) : null}
      </td>
    </tr>
  );
};
