import express from "express";
import config from "./config";
import {fork} from 'child_process'
import { WorkerData } from "./types";



const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

app.listen(config.port || 3100, async () => {

  runWorker({contract: '0x0c5ab026d74c451376a4798342a685a0e99a5bee', timeout: .5, interval: 5,name: 'MachineFi NFT', symbol: 'MFI', chainId: '20' });

})



function runWorker(data: WorkerData) {
  let worker = fork('lib/worker', [JSON.stringify(data)]);
  worker.addListener('exit', (code) => {
    runWorker(data)
  })
}

  
