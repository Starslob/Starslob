import React, { createContext, useState, useEffect, useContext } from "react";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [selector, setSelector] = useState(null);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    const initNear = async () => {
      const selectorInstance = await setupWalletSelector({
        network: "testnet",
        modules: [setupNearWallet()],
      });

      const modal = setupModal(selectorInstance, {
        contractId: "test.testnet",
      });

      modal.show();

      setSelector(selectorInstance);

      if (selectorInstance.isSignedIn()) {
        const accounts = await selectorInstance.getAccounts();
        setAccountId(accounts[0].accountId);
        setConnected(true);
      }
    };

    initNear();
  }, []);

  const connectWallet = async () => {
    const walletInstance = await selector.wallet("near-wallet");
    await walletInstance.signIn({ contractId: "test.testnet" });
    setWallet(walletInstance);
  };

  const disconnectWallet = async () => {
    if (wallet) {
      await wallet.signOut();
      setConnected(false);
      setAccountId("");
    }
  };

  return (
    <Web3Context.Provider
      value={{
        connected,
        accountId,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  return useContext(Web3Context);
};
