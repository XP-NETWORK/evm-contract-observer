
import mongoose from "mongoose";    
import config from "./config";
import { ethers, providers} from "ethers";
import { WorkerData, ContractStruct } from "./types";
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

  const contracts:ContractStruct = Object.keys(args.contracts).reduce((acc, cur) => {
       return {
           ...acc,
           [cur.toLowerCase()]: args.contracts[cur]
       } 
  }, {});


  Object.keys(contracts).forEach(contract => {
      contracts[contract]._contract = new ethers.Contract(contract, abi.abi, provider)
  })


  //const contractSet = Object.keys(contracts).map();

  const interval = args.interval * 1000;

  const block = args.block;

  const chainId = args.chainId;


  const indexUpdater = IndexUpdater();

 


  setTimeout(async () => {

    let blockNum =  await provider.getBlockNumber().catch(e => process.exit());
    

    setInterval(async () => {

       
        //console.log(await _contract.ownerOf(795).catch((e) => ''));
      

        try {

        
        console.log('parsing block ', block? block : blockNum);

            
        let trxs = (await provider.getBlockWithTransactions(block? block : blockNum)).transactions;

        const newBlock =  await provider.getBlockNumber().catch(e => blockNum + 1);

        blockNum = blockNum + 1 > newBlock? newBlock: blockNum + 1;

        const toUpdate: { tokenId: string; owner: string, contract: string }[] = [];
        const toDecode: ethers.providers.TransactionResponse[] = [];
        
        for (const trx of trxs) {
            /*
              const inputs = ethers.utils.defaultAbiCoder.decode(
                ["address", "address", "uint256"],
                ethers.utils.hexDataSlice(trx.data, 4)
              );
            */
              toDecode.push(trx);
          }
    

          let reps = await Promise.all(
            toDecode.map(async (trx) => {
              return await trx.wait();
            })
          );

         
    
          reps = reps.filter((rep) =>
            rep.logs.find((log) => Object.keys(contracts).includes(log.address.toLowerCase()))
          );

       
    
          for (const rep of reps) {
        
            const transfers = rep?.logs.filter(
              (log) => Object.keys(contracts).includes(log.address.toLowerCase())
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
                          contract: transfer.address.toLowerCase()
                      });
                }
             
            }
          }

          console.log(`Found ${toUpdate.length}`);
          if (toUpdate.length) {
              console.log(toUpdate);
          }


          for (const nft of toUpdate) {
             
            const doc = await indexUpdater.findOne({
                contract: nft.contract,
                chainId,
                tokenId: nft.tokenId
            })

            if (doc) {
                //@ts-ignore
                indexUpdater.remove(doc._id)
            } 

            await indexUpdater.create({
                name: contracts[nft.contract].name,
                symbol:  contracts[nft.contract].symbol,
                owner: nft.owner,
                uri: doc? doc.uri: (await contracts[nft.contract]?._contract?.tokenURI(parseInt(nft.tokenId)).catch((e) => '')),
                chainId,
                contract: nft.contract,
                tokenId: nft.tokenId,
                contractType: 'ERC721'
            })
              
          }

     

        } catch (e) {
            console.log(e,'error');
            process.exit()
        }

    }, interval)






  }, (timeout + Math.random()) * 1000)

  setTimeout(() => process.exit(), 1000 * 60 * 30)