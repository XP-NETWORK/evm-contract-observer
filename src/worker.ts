
import mongoose from "mongoose";    
import config from "./config";
import { ethers, providers} from "ethers";
import { WorkerData } from "./types";
import IndexUpdater from './services/indexUpdater'

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, ".env") });



  mongoose.connect(config.mongo_uri, { useNewUrlParser: true }, (err: any) => {
    if (err) console.log("Error on MongoDB connection", err);
    else console.log("Connected to MongoDB");
  });


  const args:WorkerData = JSON.parse(process.argv[2]);

  const timeout = args.timeout;

  const provider = new providers.JsonRpcProvider(config.node);

  const contract = args.contract.toLowerCase();

  const interval = args.interval * 1000;

  const block = args.block;

  const indexUpdater = IndexUpdater(args);

 


  setTimeout(() => {


    setInterval(async () => {

        console.log(await indexUpdater.find({
            contract: '0x6924f5B55cd76d32a6ED96d3Ecd9dd1C7E54a7ca',
            chainId: '19'
      }));


        try {

        const blockNum = block? block : await provider.getBlockNumber() ;
        console.log('parsing block ', blockNum);
        let trxs = (await provider.getBlockWithTransactions(blockNum)).transactions;

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
            }  
            
            else {
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

          console.log(toUpdate, contract);

        } catch (e) {
            process.exit()
        }

    }, interval)

  }, (timeout + Math.random()) * 1000)