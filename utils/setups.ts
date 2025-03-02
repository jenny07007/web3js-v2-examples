import { Client } from "./types";
import {
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  createTransactionMessage,
  TransactionSigner as KitTransactionSigner,
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
  IInstruction,
  appendTransactionMessageInstruction,
} from "@solana/kit";

// Import types from @solana/web3.js for compatibility with @solana-program/system
import {
  TransactionSigner as Web3TransactionSigner,
  Address as Web3Address,
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
export const createDefaultSolanaClient = (): Client => {
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
  feePayer: KitTransactionSigner | Web3TransactionSigner<string>,
) => {
  // Convert Web3TransactionSigner to KitTransactionSigner if needed
  const kitFeePayer = feePayer as unknown as KitTransactionSigner;

  // Retrieve the latest blockhash from the Solana network.
  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash()
    .send();

  // Create and configure the transaction message.
  return pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(kitFeePayer, tx),
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

/**
 * Helper function to append an instruction to a transaction message, handling type conversions.
 *
 * @param instruction - The instruction to append, can be from @solana/web3.js or @solana/kit
 * @param transactionMessage - The transaction message to append the instruction to
 * @returns The updated transaction message
 */
export const appendInstruction = <T extends CompilableTransactionMessage>(
  instruction: any,
  transactionMessage: T,
): T => {
  // Convert the instruction to the expected type for appendTransactionMessageInstruction
  const kitInstruction = instruction as unknown as IInstruction<string>;
  return appendTransactionMessageInstruction(
    kitInstruction,
    transactionMessage,
  );
};

/**
 * Helper function to convert a Kit address to a Web3 address
 *
 * @param address - The Kit address to convert
 * @returns The address as a Web3 address
 */
export const toWeb3Address = <T extends string>(address: T): Web3Address<T> => {
  return address as unknown as Web3Address<T>;
};

/**
 * Helper function to convert a Kit signer to a Web3 transaction signer
 *
 * @param signer - The Kit signer to convert
 * @returns The signer as a Web3 transaction signer
 */
export const toWeb3Signer = <T extends string>(
  signer: KitTransactionSigner,
): Web3TransactionSigner<T> => {
  return signer as unknown as Web3TransactionSigner<T>;
};
