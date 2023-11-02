import React from "react";
import { useAppStore } from "../AppStore";
import { ITransactionData, ITransactionDetails, TTransactionStatus } from "../services/ApiService";
import { Copyable } from "./ui/Copyable";
import { ErrorToast } from "./ui/ErrorToast";

interface IProps {
  tx: ITransactionData;
}

const formatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

const outgoingIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);
const incomingIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
  </svg>
);
const rebalanceIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6 6m0 0l-6-6m6 6V9a6 6 0 0112 0v3" />
  </svg>
);
const pendingIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DIVISIONS: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, name: "seconds" },
  { amount: 60, name: "minutes" },
  { amount: 24, name: "hours" },
  { amount: 7, name: "days" },
  { amount: 4.34524, name: "weeks" },
  { amount: 12, name: "months" },
  { amount: Number.POSITIVE_INFINITY, name: "years" },
];

function formatTimeAgo(date: Date) {
  let duration = (date.valueOf() - new Date().valueOf()) / 1000;

  for (let i = 0; i < DIVISIONS.length; i++) {
    const division = DIVISIONS[i];
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name);
    }
    duration /= division.amount;
  }
}

function isFinal(status: TTransactionStatus) {
  switch (status) {
    case "COMPLETED":
    case "FAILED":
    case "CANCELLED":
      return true;
    default:
      return false;
  }
}

function statusColor(status: TTransactionStatus) {
  switch (status) {
    case "PENDING_SIGNATURE":
    case "CANCELLING":
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

function getDirection(walletId: string, details?: ITransactionDetails) {
  if (!details) {
    return pendingIcon;
  }
  const isOutgoing = (tx: ITransactionDetails) => tx.source.walletId === walletId;
  const isIncoming = (tx: ITransactionDetails) => tx.destination.walletId === walletId;

  if (isOutgoing(details) && isIncoming(details)) {
    return rebalanceIcon;
  } else if (isOutgoing(details)) {
    return outgoingIcon;
  } else if (isIncoming(details)) {
    return incomingIcon;
  }
}

export const TransactionRow: React.FC<IProps> = ({ tx }) => {
  const { walletId, cancelTransaction, signTransaction } = useAppStore();
  const isMountedRef = React.useRef<boolean>(false);
  const [inProgress, setInProgress] = React.useState<boolean>(false);
  const [isSdkCompletedSigning, setSdkCompletedSigning] = React.useState<boolean>(false);
  const [errorStr, setErrorStr] = React.useState<string | null>(null);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const onSignTransactionClicked = async (txId: string) => {
    setInProgress(true);
    try {
      setErrorStr(null);
      setSdkCompletedSigning(false);
      await signTransaction(txId);
      setSdkCompletedSigning(true);
      setInProgress(false);
    } catch (err: unknown) {
      setInProgress(false);
      if (err instanceof Error) {
        setErrorStr(err.message);
      } else {
        setErrorStr("Unknown error");
      }
    }
  };

  const onCancelTransactionClicked = async (txId: string) => {
    await cancelTransaction(txId);
  };

  const label = inProgress ? "Signing..." : "Sign";
  const isOutgoing = (tx: ITransactionDetails) => tx.source.walletId === walletId;

  return (
    <tr key={tx.id}>
      <td className="px-1 text-ellipsis overflow-hidden whitespace-nowrap">
        <>
          <ErrorToast errorStr={errorStr} />
          <Copyable value={tx.id} />
        </>
      </td>
      <td className="px-1">{formatTimeAgo(new Date(tx.createdAt!))}</td>
      <td className="px-1">{tx.details?.assetId}</td>
      <td className="px-1">
        <div className="flex gap-1 items-center">
          <span>{walletId && getDirection(walletId, tx.details)}</span>
          <span>{tx.details?.operation}</span>
        </div>
      </td>
      <td className="px-1">
        <div className={statusColor(tx.status)}>{tx.status}</div>
      </td>
      <td className="px-1">
        {isSdkCompletedSigning ? (
          <div>Signed</div>
        ) : (
          <div className="flex gap-1">
            {tx.status === "PENDING_SIGNATURE" ? (
              <button
                className="btn btn-sm btn-primary"
                disabled={inProgress}
                onClick={() => onSignTransactionClicked(tx.id)}
              >
                {label}
              </button>
            ) : null}
            {tx.details && !isFinal(tx.status) && (
              <button
                className="btn btn-sm btn-secondary"
                disabled={inProgress || tx.status === "CANCELLING"}
                onClick={() => onCancelTransactionClicked(tx.id)}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};
