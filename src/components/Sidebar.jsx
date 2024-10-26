import React, { useState } from "react";
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

const Sidebar = () => {
  const [isGamemodalOpen, setIsGamemodalOpen] = useState(false);
  const { account, btcBalance, stxBalance } = useWeb3(); // Get account and balances from Web3 context

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
                <h6>{parseFloat(stxBalance).toFixed(2)} STX</h6>
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
      {isGamemodalOpen && <Modal onClose={handleCloseGamemodal} />}
    </>
  );
};

export default Sidebar;
