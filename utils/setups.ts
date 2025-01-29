import { Client } from "./types";
import {
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  createTransactionMessage,
  TransactionSigner,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPairSigner,
  airdropFactory,
  lamports,
  CompilableTransactionMessage,
  TransactionMessageWithBlockhashLifetime,
  Commitment,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
} from "@solana/web3.js";

import {
  DEFAULT_RPC_URL_LOCAL,
  DEFAULT_RPC_SUBSCRIPTIONS_URL_LOCAL,
  // DEFAULT_RPC_URL_DEVNET,
  // DEFAULT_RPC_SUBSCRIPTIONS_URL_DEVNET,
} from "./constants";

/**
 * Creates and returns a Solana client with RPC and subscription endpoints.
 */
export const createDefultSolanaClient = (): Client => {
  const rpc = createSolanaRpc(DEFAULT_RPC_URL_LOCAL);
  const rpcSubscriptions = createSolanaRpcSubscriptions(
    DEFAULT_RPC_SUBSCRIPTIONS_URL_LOCAL,
  );
  return { rpc, rpcSubscriptions };
};

/**
 * Constructs a default transaction message by setting the fee payer and blockhash lifetime.
 *
 * @param client - The Solana client instance.
 * @param feePayer - The transaction signer who will pay the transaction fee.
 * @returns A compilable transaction message with the fee payer and blockhash lifetime set.
 */
export const createDefaultTransaction = async (
  client: Client,
  feePayer: TransactionSigner,
) => {
  // Retrieve the latest blockhash from the Solana network.
  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash()
    .send();

  // Create and configure the transaction message.
  return pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  );
};

/**
 * Generates a new key pair signer and airdrops a specified amount of SOL to it.
 *
 * @param client - The Solana client instance.
 * @param putLamports - The amount of lamports to airdrop (default is 1 SOL).
 * @returns The newly generated transaction signer.
 */
export const generateKeyPairSignerWithSol = async (
  client: Client,
  putLamports: bigint = 1_000_000_000n, // default 1 SOL
) => {
  // Generate a new key pair signer.
  const signer = await generateKeyPairSigner();
  console.log("Signer Address: ", signer.address);

  // Airdrop the specified amount of SOL to the signer's address.
  await airdropFactory(client)({
    recipientAddress: signer.address,
    lamports: lamports(putLamports),
    commitment: "confirmed",
  });

  return signer;
};

/**
 * Signs the transaction message with the provided signers and sends it to the network.
 *
 * @param client - The Solana client instance.
 * @param transactionMessage - The transaction message to be signed and sent.
 * @param commitment - The level of commitment desired when querying the network (default is "confirmed").
 * @returns The signature of the confirmed transaction.
 */
export const signAndSendTransaction = async (
  client: Client,
  transactionMessage: CompilableTransactionMessage &
    TransactionMessageWithBlockhashLifetime,
  commitment: Commitment = "confirmed",
) => {
  // Sign the transaction message using the provided signers.
  const signedTransaction = await signTransactionMessageWithSigners(
    transactionMessage,
  );

  // Extract the signature from the signed transaction.
  const signature = getSignatureFromTransaction(signedTransaction);

  // Send the signed transaction and confirm its status on the network.
  await sendAndConfirmTransactionFactory(client)(signedTransaction, {
    commitment,
    skipPreflight: false,
  });

  return signature;
};
