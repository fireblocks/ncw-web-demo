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

  const removeClicked = async () => {
    setInProgress(true);
    try {
      await removeWeb3Connection(session.id);
    } finally {
      if (isMountedRef.current) {
        setInProgress(false);
      }
    }
  };

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (!session.sessionMetadata) {
    return null;
  }

  const { appName, appDescription, appUrl, appIcon } = session.sessionMetadata;
  return (
    <tr key={session.id}>
      <td>{appName}</td>
      <td>{appDescription}</td>
      <td>{appUrl}</td>
      <td>{appIcon && <img src={appIcon}/>}</td>
      <td>
        <button className="btn btn-sm btn-secondary" disabled={inProgress} onClick={removeClicked}>
          Remove
        </button>
      </td>
    </tr>
  );
};
