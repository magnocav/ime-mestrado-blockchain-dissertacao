# Basic Configurations to Boot Strap of the Network

### Before configure network, generate crypto-material inside organizations

    - Verify the contents of crypto-config/* inside each organization.
    - This step is mandatory, in order to sign the channel configuration transaction file.
    - Run "cryptoGenerate.sh"

### Edit and verify the "configtx.yaml".

    - It is necessary to prepare the basic configurations of the network.

### Generate genesis block for the orderer.

    - Run "configtxBlockGenesisSys.sh"
    - You may inspect the genesis block running "genesisBlockSysDecode.sh"

### Generate the channel configuration transaction file.

    - Run "configtxChannelGenerateSys.sh"

### Create the anchor-peer transaction file.

    - Run "configtxAnchorPeerGenerate.sh"

### Translate genesis block to JSOn.

    - Run "genesisBlockDecodeSys.sh"


### OPTCIONAL: Prepare the CouchDB runtime
    - Run "couchdb-config.sh"
