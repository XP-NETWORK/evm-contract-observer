import express from "express";
import config from "./config";
import {fork} from 'child_process'
import { WorkerData } from "./types";



const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

app.listen(config.port || 3100, async () => {

  runWorker({contract: '0x0c5ab026d74c451376a4798342a685a0e99a5bee', timeout: .5, interval: 5 ,name: 'MachineFi NFT', symbol: 'MFI', chainId: '20' });

  runWorker({contract: '0xbe6514fc4a702793e46fe3516fc70d160d13a463', timeout: 1, interval: 5 ,name: 'Iotexsons special', symbol: 'TIOSS', chainId: '20' });
  runWorker({contract: '0x30582ede7fadeba4973dd71f1ce157b7203171ea', timeout: 2, interval: 5 ,name: 'Ucam Pioneer', symbol: 'UPT', chainId: '20' });
  runWorker({contract: '0x55cbc794f7577e3d6b787c014a607c39373632eb', timeout: 2.5, interval: 5 ,name: 'Iotexsons avatar', symbol: 'TIOS', chainId: '20'});
})



function runWorker(data: WorkerData) {
  let worker = fork('lib/worker', [JSON.stringify(data)]);
  worker.addListener('exit', (code) => {
    runWorker({
      ...data,
      timeout: 0
    })
  })
}

  
