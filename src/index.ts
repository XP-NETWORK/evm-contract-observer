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

const contracts: ContractStruct = {
  "0x948E8c6E0c9035f7372a10e10f9f71cC81341053": {
    name: "VelasPunks",
    symbol: "VPUNKS",
  },

  //"0xb73CC6D7a621E0e220b369C319DBFaC258cEf4D2": {

  // }
};

const CS = ContractService();
const IU = IndexUpdater();

app.listen(config.port || 3100, async () => {
  try {
    const iotex: ContractStruct = JSON.parse(await CS.readFromFile("iotex"));

    //console.log(contracts);

    /*runWorker({
    rpc: 'https://explorer.velas.com/rpc',
    contracts,
    timeout: 0.5,
    interval: 5,
    chainId: "19",
    block:16969037
    
  });*/

    runWorker({
      rpc: "https://babel-api.mainnet.iotex.io",
      contracts: iotex,
      timeout: 0.5,
      interval: 5,
      chainId: "20",
    });
  } catch (e) {
    console.log(e, 'in master process');
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
