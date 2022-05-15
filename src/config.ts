import dotenv from "dotenv";

dotenv.config({ path: ".env" });

function getOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env var ${key}`);
  }
  return value;
}

export default  {
    port: getOrThrow('PORT'),
    contract: getOrThrow('CONTRACT'),
    node: getOrThrow('RPC_NODE'),
    mongo_uri: getOrThrow('MONGO_URI'),
}

