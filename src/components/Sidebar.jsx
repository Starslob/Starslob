import React, { useState, useEffect } from "react";
import { StacksMainnet } from "@stacks/network";
import { AccountsApi } from "@stacks/blockchain-api-client"; // Imported AccountsApi for fetching STX balance
import { useWeb3 } from "../Web3Provider";
import btc from "../assets/img/btc.png";
import stacks from "../assets/img/stacks.png";
import useimage from "../assets/address.jpg";
import Modal from "./Modal";

// Dummy data for your top users
const Ongoinggm = [
  { id: 1, title: "Tolujohn Bob", reward: "30", level: "1" },
  { id: 2, title: "Fabrre don", reward: "15", level: "6" },
  { id: 3, title: "Naccy colen", reward: "10", level: "3" },
  { id: 4, title: "Petter collin", reward: "25", level: "5" },
  { id: 5, title: "Rugberbs", reward: "20", level: "2" },
];

// Function to fetch BTC balance using a public API
const fetchBitcoinBalance = async (btcAddress) => {
  try {
    const response = await fetch(
      `https://blockstream.info/api/address/${btcAddress}`
    );
    const data = await response.json();
    const balanceInSatoshis =
      data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    const balanceInBTC = balanceInSatoshis / 100000000; // Convert satoshis to BTC
    return balanceInBTC;
  } catch (error) {
    console.error("Failed to fetch BTC balance:", error);
    return "0";
  }
};

// Function to fetch STX balance using Stacks.js
const fetchStacksBalance = async (stxAddress) => {
  const network = new StacksMainnet();
  const accountsApi = new AccountsApi();
  try {
    const accountInfo = await accountsApi.getAccountInfo({
      principal: stxAddress,
      network: network,
    });
    const balanceInMicroSTX = accountInfo.balance;
    const balanceInSTX = balanceInMicroSTX / 1000000; // Convert microSTX to STX
    return balanceInSTX;
  } catch (error) {
    console.error("Failed to fetch STX balance:", error);
    return "0";
  }
};

const Sidebar = () => {
  const [isGamemodalOpen, setIsGamemodalOpen] = useState(false);
  const [btcBalance, setBtcBalance] = useState("0");
  const [stxBalance, setStxBalance] = useState("0");
  const { account } = useWeb3(); // Get the connected STX account from Web3 context

  useEffect(() => {
    const fetchBalances = async () => {
      const btcAddress = account; // Use STX account as a placeholder for BTC address (if applicable)
      const stxAddress = account; // STX address from the connected wallet

      try {
        // Fetch BTC balance
        const btcBal = await fetchBitcoinBalance(btcAddress);
        setBtcBalance(btcBal);

        // Fetch STX balance
        const stxBal = await fetchStacksBalance(stxAddress);
        setStxBalance(stxBal);
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };

    if (account) {
      fetchBalances(); // Only fetch balances if the account is available
    }
  }, [account]);

  const handleGamemodalClick = () => {
    setIsGamemodalOpen(true);
  };

  const handleCloseGamemodal = () => {
    setIsGamemodalOpen(false);
  };

  return (
    <>
      <div className="col-lg-4">
        {/* Recent Activity */}
        <div className="card info-card revenue-card">
          <div className="card-body">
            <h5 className="card-title">Balance:</h5>
            <div className="d-flex align-items-center">
              <div className="card-icon rounded-circle d-flex align-items-center justify-content-center">
                <img id="balance" src={btc} alt="BTC Logo" />
              </div>
              <div className="ps-3">
                <h6>{parseFloat(btcBalance).toFixed(2)} BTC</h6>
              </div>
            </div>
            <hr />
            <div className="d-flex align-items-center">
              <div className="card-icon rounded-circle d-flex align-items-center justify-content-center">
                <img id="balance" src={stacks} alt="STX Logo" />
              </div>
              <div className="ps-3">
                <h6> {parseFloat(stxBalance).toFixed(2)} STX</h6>
              </div>
            </div>
          </div>
        </div>
        {/* End Recent Activity */}

        {/* News & Updates Traffic */}
        <div className="card">
          <div className="card-body pb-0">
            <h5 className="card-title">Top Genius</h5>
            <div className="news">
              {Ongoinggm.map((card) => (
                <div
                  key={card.id}
                  className="post-item clearfix"
                  style={{
                    background: "#213743",
                    borderRadius: "5px",
                    marginBottom: "10px",
                    padding: "10px",
                  }}
                >
                  <img src={useimage} alt="User" />
                  <h4>
                    <a href="#">{card.title}</a>
                  </h4>
                  <p>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span style={{ color: "#b1bad3" }}>
                          Quiz Won: {card.level}
                        </span>
                      </div>
                      <div>
                        <button onClick={handleGamemodalClick} id="followbtn">
                          Follow
                        </button>
                      </div>
                    </div>
                  </p>
                </div>
              ))}
            </div>
            {/* End sidebar recent posts */}
          </div>
        </div>
        {/* End News & Updates */}
      </div>
      <>{isGamemodalOpen && <Modal onClose={handleCloseGamemodal} />}</>
    </>
  );
};

export default Sidebar;
