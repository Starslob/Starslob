import React, { createContext, useState, useEffect, useContext } from "react";
import { AppConfig, UserSession, showConnect, openContractCall } from "@stacks/connect";
import { StacksTestnet } from "@stacks/network";
import { bufferCV, uintCV } from "@stacks/transactions";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    const appConfig = new AppConfig();
    const session = new UserSession({ appConfig });

    if (session.isUserSignedIn()) {
      const userData = session.loadUserData();
      setAccount(userData.profile.stxAddress.testnet); // Stacks Testnet Address
      setConnected(true);
    } else if (session.isSignInPending()) {
      session.handlePendingSignIn().then((userData) => {
        setAccount(userData.profile.stxAddress.testnet);
        setConnected(true);
      });
    }

    setUserSession(session);
  }, []);

  const connectWallet = () => {
    showConnect({
      userSession,
      network: new StacksTestnet(),
      appDetails: {
        name: "Your DApp Name",
        icon: "https://example.com/icon.png",
      },
      onFinish: () => {
        const userData = userSession.loadUserData();
        setAccount(userData.profile.stxAddress.testnet);
        setConnected(true);
      },
      onCancel: () => {
        console.error("Wallet connection canceled");
      },
    });
  };

  const disconnectWallet = () => {
    userSession.signUserOut(window.location.origin);
    setConnected(false);
    setAccount("");
  };

  const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Web3Context.Provider
      value={{
        connected,
        account,
        connectWallet,
        disconnectWallet,
        shortenAddress,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
