import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { txRouter } from "./router";
import config from "./config";
import mongoose from "mongoose";
import axios from "axios";
import { ethers, providers, BigNumber as EthBN } from "ethers";
import abi from "./abi";
import { Base64 } from "js-base64";
var os = require("os");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, ".env") });

(async function main() {
  const app = express();

  app.use(cors());

  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ extended: true }));

  mongoose.connect(config.mongo, { useNewUrlParser: true }, (err: any) => {
    if (err) console.log("Error on MongoDB connection", err);
    else console.log("Connected to MongoDB");
  });

  console.log(process.env["RPC_NODE"]);

  const provider = new providers.JsonRpcProvider(process.env["RPC_NODE"]);

  const contract = process.env["CONTRACT"]?.toLowerCase();

  app.listen(config.port || 3100, async () => {
    setInterval(async () => {
      const _contract = new ethers.Contract(contract!, abi.abi, provider)

      //console.log( await c.ownerOf(7307))

      const num = await provider.getBlockNumber();
      let trxs = (await provider.getBlockWithTransactions(
        

        17320006)).transactions;

      const toUpdate: { tokenId: string; owner: string }[] = [];
      const toDecode: ethers.providers.TransactionResponse[] = [];

      for (const trx of trxs) {
        if (trx.to?.toLowerCase() === contract) {
          const inputs = ethers.utils.defaultAbiCoder.decode(
            ["address", "address", "uint256"],
            ethers.utils.hexDataSlice(trx.data, 4)
          );
          toUpdate.push({
            tokenId: inputs[2].toString(),
            owner: inputs[1].toLowerCase(),
          });
        } else {
          toDecode.push(trx);
        }
      }

      let reps = await Promise.all(
        toDecode.map(async (trx) => {
          return await trx.wait();
        })
      );

      reps = reps.filter((rep) =>
        rep.logs.find((log) => log.address.toLowerCase() === contract)
      );

      for (const rep of reps) {
        const log = rep?.logs.filter(
          (log) => log.address.toLowerCase() === contract
        )[1];

        if (log) {
          toUpdate.push({
            tokenId: ethers.utils.defaultAbiCoder
              .decode(["uint256"], log?.topics[3])
              .toString(),
            owner: ethers.utils.defaultAbiCoder
              .decode(["address"], log?.topics[2])[0]
              .toLowerCase(),
          });
        }
      }

      console.log(toUpdate);

      //const token = await _contract.ownerOf(44049)
      //console.log(token);
      

      //if (toUpdate.every(trx => trx.owner.toLowerCase() === token.toLowerCase())) {
       // console.log('nice');
      //}

      //if ()  {

      //console.log(topics[1]);
      // toUpdate.push({
      //tokenId: ethers.utils.defaultAbiCoder.decode(['address'], ethers.utils.hexDataSlice(topics, 4));
      //owner: topics[1]
      //})
      // }

      //console.log(toUpdate);

      //const num = await provider.getBlockNumber();
      //const bt = '0x23b872dd000000000000000000000000d2f05d05d13497bba887032ffc2c26031639427f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018f';
      //const trx = await provider.getTransaction('0xd2e0e457a02a0574a2606cc917e22658297184b7dcc3ea0a28aff19be1d5760f');
      //console.log(await trx.wait());
      //let trxs = (await provider.getBlockWithTransactions(17373096)).transactions;

      //console.log(ethers.utils.defaultAbiCoder.decode(['bytes'], ethers.utils.hexDataSlice(bt, 4)));

      //trxs = trxs.filter(t => t.to?.toLowerCase() === process.env['CONTRACT']?.toLowerCase())

      //const iface = new ethers.utils.Interface(abi.abi)

      //const trx = await trxs[0].wait();

      //console.log(trxs);

      //iface.decodeFunctionData('atomicMatch_', t)
      //console.log(trxs.length, 'trxs');
      //console.log(ethers.utils.defaultAbiCoder.decode(["address[14]", "uint256[18]", "uint8[8]", "bytes", "bytes", "bytes", "bytes", "bytes", "bytes", "uint8[2]", "bytes32[5]"],   ethers.utils.hexDataSlice(trxs[0].data, 4)));
      //console.log(ethers.utils.defaultAbiCoder.decode(["address", "address", "uint256"],   ethers.utils.hexDataSlice(trxs[0].data, 4)));
    }, 5000);
  });
})();
