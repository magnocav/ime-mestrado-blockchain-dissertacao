# General instructions about how to prepare to run these examples

1. Generate Crypto Assets
    Edit configuration at ./config/crypto-config.yaml
    Review commands at ./config/cryptoGenerate.sh
    Run ./config/cryptoGenerate.sh
    Inspect results at ./crypto-config/*

2. Generate Wallets
    Inspect JSON model at ./wallet/walletModel.js
    Review commands at ./wallet/walletEccKeyPairsGenerate.js
    Move to folder ./wallet/
    Run "node walletEccKeyPairsGenerate.js"

3. Prepare Containers
    Inspect docker-compose.yaml

4. Load Blockchain Network
    Use "devnetLaunch.sh" to run "docker-compose -f ./docker-compose.yaml up -d"

5. Create channel "devchannel", from Peer0 at Guarani
    Load cliGUarani, using "loadCliGuarani.sh"
    Execute commands to create channel. Use "./network/peerChannelCreateByGuarani.sh" as reference

6. Join Peer0 at Ticcuna to channel "devchannel"
    Load cliTiccuna, using "loadCliTiccuna.sh"
    Execute commands to join channel. Use "./network/peerChannelJoinByTiccuna.sh" as reference

7. Join Peer0 at Xavante to channel "devchannel"
    Load cliXavante, using "loadCliXavante.sh"
    Execute commands to join channel. Use "./network/peerChannelJoinByXavante.sh" as reference

8. Verify Blockchain Components Health
    Execute "./network/networkTestHealth.sh"
