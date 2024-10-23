# Stacrslob Contract

### Deploy Your Contract to the Stacks Blockchain

1. Generate Stacks address for deploying:

- If you're using a testnet, generate a test address from the Stacks Faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet
- For Mainnet: https://explorer.stacks.co/?chain=mainnet

2. Deploy your contract using the Stacks CLI:

- Authenticate by running: `stx auth`

- Deploy your contract: `stx contract deploy quiz-platform quiz-platform.clar --network=testnet --sender=<YOUR_STACKS_ADDRESS>`

3. Verify Deployment:

- Testnet Explorer: explorer.stacks.co
- Mainnet Explorer: explorer.stacks.co
