import React from "react";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";
import { IAccount } from "../services/ApiService";

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = React.useState<IAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = React.useState<boolean>(false);

  const { getAccounts } = useAppStore();

  React.useEffect(() => {
    let cancelled = false;
    const fetchAccounts = async () => {
      setIsLoadingAccounts(true);
      const accounts = await getAccounts();
      if (!cancelled) {
        setAccounts(accounts);
        setIsLoadingAccounts(false);
      }
    };
    fetchAccounts();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoadingAccounts) {
    return (
      <Card title="Accounts">
        <div>Loading...</div>
      </Card>
    );
  }

  return (
    <Card title="Accounts">
      <div>
        {accounts.map((account) => {
          return <div key={account.accountId}>accountId: {account.accountId}</div>;
        })}
      </div>
    </Card>
  );
};
