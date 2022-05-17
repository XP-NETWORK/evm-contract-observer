const mongoose = require("mongoose");
const IndexDoc = require("./schema");
const abi = ADD_ABI;
const address = ADD_ADDRESS;
const mongodb_uri = ADD_MONGODB_URI;
const rpc = ADD_RPC;

let Contract = require("web3-eth-contract");
Contract.setProvider(rpc);
const contract = new Contract(abi, address);

mongoose.connect(mongodb_uri, { useNewUrlParser: true }, (err) => {
  if (err) console.log("Error on MongoDB connection", err);
  else console.log("Connected to MongoDB");
});

const getData = async (CONTRACT_TO_SCRAPE) => {

  for (let i = 0; i <= ADD_TOTALSUPPY; i++) {
    console.log(i);
    try {
      const owner = await CONTRACT_TO_SCRAPE.methods.ownerOf(i).call();
      const uri = await CONTRACT_TO_SCRAPE.methods.tokenURI(i).call();

      if (!owner) {
        return;
      } else {

        const indexDoc = new IndexDoc({
          chainId: ADD_CHAIN_ID,
          tokenId: i,
          owner: owner.toLowerCase(),
          contract: ADD_CONTRACT_ADDRESS,
          uri: uri.toLowerCase() || "no uri",
          name: ADD_NAME,
          contractType: ADD_CONTRACT_TYPE,
          symbol: ADD_SYMBOL,
        });
        indexDoc.save().then((res) => {console.log(res.tokenId)})
          .catch((err) => {console.log(err.message)})}

    } catch (err) {
      console.log(err.message);
    }
  }
};
