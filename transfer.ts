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
  createDefultSolanaClient,
  signAndSendTransaction,
} from "./utils/setups";

import devWallet from "./dev-wallet.json";

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
    const client = createDefultSolanaClient();

    // createDefaultTransaction abstracts the creation of a transaction message, sets the payer, and retrieves the latest blockhash.
    const txMsg = pipe(await createDefaultTransaction(client, sender), (tx) =>
      // Append the transfer instruction to the transaction, specifying the transfer of SOL.
      appendTransactionMessageInstruction(
        // getTransferSolInstruction is imported from @solana-program/system
        getTransferSolInstruction({
          amount: lamports(BigInt(0.7 * 1e9)),
          destination: recipient.address,
          source: sender,
        }),
        tx,
      ),
    );

    // Sign and send the transaction using the signAndSendTransaction function from utils/setups.ts
    const txSig = await signAndSendTransaction(client, txMsg);

    console.log("Transaction Signature: ", txSig);

    // Retrieve and display the recipient's wallet balance.
    const recipientBalance = await client.rpc
      .getBalance(recipient.address)
      .send();

    console.log(
      `Recipient Wallet Balance:  ${Number(recipientBalance.value) / 1e9} SOL`,
    );
  } catch (error) {
    console.log(error);
  }
})();
