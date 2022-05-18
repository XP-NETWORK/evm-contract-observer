import express from "express";
import config from "./config";
import { fork } from "child_process";
import { WorkerData, ContractStruct } from "./types";
import IndexUpdater from "./services/indexUpdater";
import ContractService from "./services/ContractService";
import fs from "fs";

const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

/*const contracts: ContractStruct = {
  "0x948E8c6E0c9035f7372a10e10f9f71cC81341053": {
    name: "VelasPunks",
    symbol: "VPUNKS",
  },

  "0x02A837BB9263a9925c71F390B0DD36BB49000E2b": {
    name: "Velhalla Land 721",
    symbol: "VL721",
   },

   "0xb73CC6D7a621E0e220b369C319DBFaC258cEf4D2": {
    name: "VelasOGPunks",
    symbol: "PUNK",
   },

   "0xF62a8a8af4E1b78053f8F53F0c8f2d2146780B92": {
    name: "VelasDogs",
    symbol: "VDOG",
   },

   "0xc9e2af6d4EfEa2BDDC2e836F79272b367fAD1712": {
    name: "Velas Name Service (.vlx)",
    symbol: "VNS",
   },

   "0xa6928F75594650e3C6237C209d221905bD714495": {
    name: "VelasOGApes",
    symbol: "OGAPES",
   },

   "0x90CAB3687fF91Ef4399Da5f09F8ba020069C9979": {
    name: "BAVC",
    symbol: "BAVC",
   },

   "0xbd529DD30C0D08DA42E737991E3B79E63f9CcCB8": {
    name: "VelasClowns",
    symbol: "CLOWN",
   },

   "0x7542E42A557C2684Adf0CAD5D511eA81a8188Bfb": {
    name: "DeadBits",
    symbol: "DEAD",
   },

   "0x6924f5B55cd76d32a6ED96d3Ecd9dd1C7E54a7ca": {
    name: "VelasPicassoApes",
    symbol: "PICASSO",
   },



};*/

const CS = ContractService();
const IU = IndexUpdater();

app.listen(config.port || 3100, async () => {
  try {
    const iotex: ContractStruct = JSON.parse(await CS.readFromFile("iotex"));
    const velas: ContractStruct = JSON.parse(await CS.readFromFile("velas"));


    runWorker({
      rpc: "https://explorer.velas.com/rpc",
      contracts: velas,
      timeout: 0.5,
      interval: 5,
      chainId: "19"
    });

    runWorker({
      rpc: "https://babel-api.mainnet.iotex.io",
      contracts: iotex,
      timeout: 0.5,
      interval: 5,
      chainId: "20",
    });
  } catch (e) {
    console.log(e, "in master process");
  }
});

function runWorker(data: WorkerData) {
  let worker = fork("lib/worker", [JSON.stringify(data)]);
  worker.addListener("exit", (code) => {
    runWorker({
      ...data,
      timeout: 0,
    });
  });
}
