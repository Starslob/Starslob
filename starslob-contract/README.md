# Stacrslob Contract

### Deploy Your Contract to the Stacks Blockchain

1. Generate Stacks address for deploying:

- If you're using a testnet, generate a test address from the Stacks Faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet
- For Mainnet: https://explorer.stacks.co/?chain=mainnet

2. Deploy your contract using the Stacks CLI:

- `cd starslob-contract`

- Check: `clarinet check`

- Generate you deployment file: `clarinet deployment generate --testnet --low-cost`

- Deploy your contract: `clarinet deployment apply -p deployments/default.testnet-plan.yaml`

- My wallet testnet: ST5HMBACVCBHDE0H96M11NCG6TKF7WVWSVSG2P53

3. Verify Deployment:

- Testnet Explorer: explorer.stacks.co
- Mainnet Explorer: explorer.stacks.co

-  Contract publish: ST5HMBACVCBHDE0H96M11NCG6TKF7WVWSVSG2P53.quizplatform