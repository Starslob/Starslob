import React, { createContext, useState, useEffect, useContext } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { StacksTestnet } from "@stacks/network";

const Web3Context = createContext();

const getBTCBalance = async (address) => {
  const url = `https://api.blockcypher.com/v1/btc/test3/addrs/${address}`;
  return fetch(url)
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        let balance = Math.trunc(data.balance / 1000) / 100000;
        return balance;
      }
      return 0;
    })
    .catch((err) => {
      console.error(err);
      return 0;
    });
};

const getSTXBalance = async (address) => {
  const url = `https://stacks-node-api.testnet.stacks.co/v2/accounts/${address}`;
  return fetch(url)
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        let balance = parseInt(data.balance, 16);
        balance = Math.trunc(balance / 10000) / 100;
        return balance;
      }
      return 0;
    })
    .catch((err) => {
      console.error(err);
      return 0;
    });
};

export const Web3Provider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [btcBalance, setBtcBalance] = useState("0");
  const [stxBalance, setStxBalance] = useState("0");
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    const appConfig = new AppConfig();
    const session = new UserSession({ appConfig });

    if (session.isUserSignedIn()) {
      const userData = session.loadUserData();
      setAccount(userData.profile.stxAddress.testnet); // Stacks Testnet Address
      setConnected(true);
      fetchBalances(userData.profile.stxAddress.testnet); // Fetch balances on load
    } else if (session.isSignInPending()) {
      session.handlePendingSignIn().then((userData) => {
        setAccount(userData.profile.stxAddress.testnet);
        setConnected(true);
        fetchBalances(userData.profile.stxAddress.testnet); // Fetch balances on sign-in
      });
    }

    setUserSession(session);
  }, []);

  const fetchBalances = async (address) => {
    const btcBal = await getBTCBalance(address); // Fetch BTC balance
    const stxBal = await getSTXBalance(address); // Fetch STX balance
    setBtcBalance(btcBal);
    setStxBalance(stxBal);
  };

  const connectWallet = () => {
    showConnect({
      userSession,
      network: new StacksTestnet(),
      appDetails: {
        name: "StarsLob",
        icon: "https://example.com/icon.png",
      },
      onFinish: () => {
        const userData = userSession.loadUserData();
        setAccount(userData.profile.stxAddress.testnet);
        setConnected(true);
        fetchBalances(userData.profile.stxAddress.testnet); // Fetch balances on connect
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
    setBtcBalance("0"); // Reset balances on disconnect
    setStxBalance("0");
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
        btcBalance,
        stxBalance,
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
