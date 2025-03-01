import {
  appendTransactionMessageInstruction,
  createKeyPairSignerFromBytes,
  generateKeyPairSigner,
  lamports,
  pipe,
} from "@solana/web3.js";
import { getTransferSolInstruction } from "@solana-program/system";
import {
  createDefaultTransaction,
  createDefaultSolanaClient,
  signAndSendTransaction,
} from "../utils/setups";

import devWallet from "../dev-wallet.json";
import { LAMPORTS_PER_SOL } from "../utils/constants";

(async () => {
  try {
    // Use a development wallet as the sender. Ensure SOL has been airdropped to this wallet beforehand.
    // Alternatively, you can use generateKeyPairSignerWithSol from utils/setups.ts
    const sender = await createKeyPairSignerFromBytes(
      new Uint8Array(devWallet),
    );

    // Generate a new key pair for the recipient.
    const recipient = await generateKeyPairSigner();

    // Initialize the Solana client using utility functions from utils/setups.ts
    const client = createDefaultSolanaClient();

    // getTransferSolInstruction is imported from @solana-program/system
    const instruction = getTransferSolInstruction({
      amount: lamports(BigInt(0.7 * LAMPORTS_PER_SOL)),
      destination: recipient.address,
      source: sender,
    });

    const txSig = await pipe(
      // createDefaultTransaction abstracts the creation of a transaction message, sets the payer, and retrieves the latest blockhash.
      await createDefaultTransaction(client, sender as any),
      // Append the transfer instruction to the transaction
      (tx) => appendTransactionMessageInstruction(instruction, tx as any),
      // Sign and send the transaction using the signAndSendTransaction function from utils/setups.ts
      (tx) => signAndSendTransaction(client, tx as any),
    );

    console.log("Transaction Signature: ", txSig);

    // Retrieve and display the recipient's wallet balance.
    const recipientBalance = await client.rpc
      .getBalance(recipient.address as any)
      .send();

    console.log(
      `Recipient Wallet Balance:  ${
        Number(recipientBalance.value) / LAMPORTS_PER_SOL
      } SOL`,
    );
  } catch (error) {
    console.log(error);
  }
})();
