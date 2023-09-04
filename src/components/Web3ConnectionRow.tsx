import React from "react";
import { useAppStore } from "../AppStore";
import { IWeb3Session } from "../services/ApiService";

interface IProps {
  session: IWeb3Session;
}

export const Web3ConnectionRow: React.FC<IProps> = ({ session }) => {
  const { removeWeb3Connection } = useAppStore();
  const isMountedRef = React.useRef<boolean>(false);
  const [inProgress, setInProgress] = React.useState<boolean>(false);
  const [errorStr, setErrorStr] = React.useState<string | null>(null);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);


  return (
    <tr key={session.id}>
      <td>{session.sessionMetadata?.appName}</td>
      <td>{session.sessionMetadata?.appDescription}</td>
      <td>{session.sessionMetadata?.appUrl}</td>
      <td>{session.sessionMetadata?.appIcon}</td>
      <td>
          <button
            className="btn btn-sm btn-secondary"
            disabled={inProgress}
            onClick={() => removeWeb3Connection(session.id)}
          >
            Remove
          </button>
      </td>
    </tr>
  );
};
