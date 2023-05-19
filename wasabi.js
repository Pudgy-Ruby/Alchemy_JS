// Setup: npm install alchemy-sdk
import { Alchemy, Network, fromHex } from "alchemy-sdk";
import { PoolABI } from './PoolABI.js';
import Web3 from "web3"
import API from "api"

const main = async () => {
    let optionId;
    let poolAddress;
    let nftAddress;
    let tokenId;

    const config = {
        apiKey: "wHC4H7cdGZbbAP-XDqeo6MNcyL0K3V3R",
        network: Network.ETH_MAINNET,
    };
    const alchemy = new Alchemy(config);


    // Replace the URL with the appropriate Ethereum node URL
    const providerURL = 'https://mainnet.infura.io/v3/eac2c2abc23b40629f211fa251f3d813';  // Infura Project ID
    const web3 = new Web3(providerURL);

    // Contract address
    const address = ["0xfc68f2130e094c95b6c4f5494158cbeb172e18a0"];
    // Get all NFTs
    const response = await alchemy.core.getAssetTransfers({
        fromBlock: "0x0",
        contractAddresses: address,
        category: ["erc721"],
        excludeZeroValue: false,
    });

    // Set NFT ID
    const nftId = 1;

    let trades = response.transfers.filter(
        (txn) => fromHex(txn.erc721TokenId) === nftId
    );

    console.log("trades:", trades);

    let exercises = response.transfers.filter(
        (txn) => fromHex(txn.erc721TokenId) === nftId && txn.to === '0x0000000000000000000000000000000000000000'
    );

    if (exercises.length > 0) {

        let blockNum = exercises[0].blockNum;
        let transactionHash = exercises[0].hash;
        console.log(transactionHash);
    
        await web3.eth.getTransaction(transactionHash, (error, transaction) => {
            if (error) {
                console.error('Error retrieving transaction:', error);
                return;
            }
            let inputData = transaction.input.slice(10);
            const decodedInput = web3.eth.abi.decodeParameters(['uint256','uint256'], inputData);
    
            optionId = decodedInput[0];
            tokenId = decodedInput[1];
    
            poolAddress = transaction.to;
        });
    
        const contractInstance = new web3.eth.Contract(
            PoolABI,
            poolAddress
        );
    
        nftAddress = await contractInstance.methods.getNftAddress().call();
        const optionData = await contractInstance.methods.getOptionData(optionId).call();
        console.log("optionData: ",optionData);
        console.log("`${nftAddress}:${tokenId}`",`${nftAddress}:${tokenId}`);


        const sdk = API('@reservoirprotocol/v3.0#36vtrdr1z8lhhl0zsv');

        sdk.auth('29933ebc-4aa9-5b0f-a55c-8568f8668120');
        sdk.server('https://api.reservoir.tools');
        await sdk.getTokensTokenActivityV5({
          sortBy: 'eventTimestamp',
          types: ['sale', 'mint'],
          token: `${nftAddress}:${tokenId}`,
          accept: '*/*'
        })
          .then(({ data }) => console.log(data.activities[0].price))
          .catch(err => console.log(err));
        
    }
}

const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
runMain();