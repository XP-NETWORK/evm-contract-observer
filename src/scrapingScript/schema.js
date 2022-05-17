const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    chainId: "string",
    tokenId: "string",
    owner: "string",
    contract: "string",
    uri: "string",
    name: "string",
    contractType: "string",
    symbol: "string",
  },
  { timestamps: true }
);

const IndexDoc = mongoose.model("eth-nft-dto", schema, "eth-nft-dto");
module.exports = IndexDoc;

