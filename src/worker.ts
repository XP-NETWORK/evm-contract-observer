
import mongoose from "mongoose";    
import config from "./config";
import { ethers, providers} from "ethers";
import { WorkerData } from "./types";
import IndexUpdater from './services/indexUpdater'
import abi from "./constants/abi";
const util = require('util')
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

  const chainId = args.chainId;

  const indexUpdater = IndexUpdater(args);

 


  setTimeout(async () => {

    let blockNum =  await provider.getBlockNumber() ;

    setInterval(async () => {

        const _contract = new ethers.Contract(args.contract, abi.abi, provider)
        //console.log(await _contract.ownerOf(795).catch((e) => ''));
      

        try {

        //const blockNum = block? block : await provider.getBlockNumber() ;
        console.log('parsing block ', blockNum, ` - ${args.name}(${args.symbol})`);

            
        let trxs = (await provider.getBlockWithTransactions(block? block : blockNum)).transactions;
        
        const newBlock =  await provider.getBlockNumber();

        blockNum = blockNum + 1 > newBlock? newBlock: blockNum + 1;

        const toUpdate: { tokenId: string; owner: string }[] = [];
        const toDecode: ethers.providers.TransactionResponse[] = [];
        
        for (const trx of trxs) {
         
            /*if (trx.to?.toLowerCase() === contract) {
              const inputs = ethers.utils.defaultAbiCoder.decode(
                ["address", "address", "uint256"],
                ethers.utils.hexDataSlice(trx.data, 4)
              );
              console.log(inputs);
              toUpdate.push({
                tokenId: inputs[2].toString(),
                owner: inputs[1].toLowerCase(),
              });
            }  
            
            else {*/
              toDecode.push(trx);
           // }
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
        
            const transfers = rep?.logs.filter(
              (log) => log.address.toLowerCase() === contract
            ).filter(l => l.topics[0].toLowerCase() === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'.toLowerCase());

   
            if (transfers && transfers.length) {


                for (const transfer of transfers) {
                    toUpdate.push({
                        tokenId: ethers.utils.defaultAbiCoder
                          .decode(["uint256"], transfer?.topics[3])
                          .toString(),
                        owner: ethers.utils.defaultAbiCoder
                          .decode(["address"], transfer?.topics[2])[0]
                          .toLowerCase(),
                      });
                }
             
            }
          }

          console.log(`Found ${toUpdate.length} nft of ${args.name}(${args.symbol})`);
          if (toUpdate.length) {
              console.log(toUpdate);
          }


          for (const nft of toUpdate) {
             
            const doc = await indexUpdater.findOne({
                contract,
                chainId,
                tokenId: nft.tokenId
            })

            if (doc) {
                //@ts-ignore
                indexUpdater.remove(doc._id)
            } 

            await indexUpdater.create({
                owner: nft.owner,
                uri: doc? doc.uri: (await _contract.tokenURI(parseInt(nft.tokenId)).catch((e) => '')),
                chainId,
                tokenId: nft.tokenId
            })
              
          }

     

        } catch (e) {
            process.exit()
        }

    }, interval)






  }, (timeout + Math.random()) * 1000)