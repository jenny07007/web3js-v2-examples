import {
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
} from "@solana/web3.js";

export type Client = {
  rpc: Rpc<SolanaRpcApi>;
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
};
