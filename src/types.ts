export interface WorkerData {
  contract: string;
  timeout: number;
  interval: number;
  name: string;
  symbol: string;
  chainId: string;
  block?:number
}