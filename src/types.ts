import { ethers } from "ethers";


export interface WorkerData {
  rpc: string,
  contracts: ContractStruct;
  timeout: number;
  interval: number;
  chainId: string;
  block?:number;
}


export interface ContractStruct {
  [key:string] :{
    name: string,
    symbol: string,
    _contract?: ethers.Contract
  }
}