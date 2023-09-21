import { FirebaseApp, initializeApp } from "firebase/app";
import React, { createContext } from "react";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2E5vK3fhxvftpfS02T8eIC3SrXnIUjrs",
  authDomain: "fireblocks-sdk-demo.firebaseapp.com",
  projectId: "fireblocks-sdk-demo",
  storageBucket: "fireblocks-sdk-demo.appspot.com",
  messagingSenderId: "127498444203",
  appId: "1:127498444203:web:31ff24e7a4c6bfa92e46ee",
};

export const FirebaseAppProviderContext = createContext<FirebaseApp | null>(null);

interface IProps {
  children?: React.ReactNode;
}

export const FirebaseAppProvider: React.FC<IProps> = ({ children }) => {
  const app = React.useMemo(() => initializeApp(firebaseConfig), []);
  return <FirebaseAppProviderContext.Provider value={app}>{children}</FirebaseAppProviderContext.Provider>;
};
