import { BorshCoder, utils } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { SWAP_IDL } from 'goatswap-sdk';

export class GoatSwap {
  private static programIds = [
    'GoatAFSqACoMvJqvgW7aFACFkkArv69ezTJhS8xdEr5H', // Mainnet
    'HKwqLZQw1fcnnFds4nkxYAmYK67TvtZ6TnVLUMJviWPL', // Devnet
  ];

  static async parseTransactions(connection: Connection, signatures: string[]) {
    const parsedTransactions = await connection.getParsedTransactions(
      signatures,
      {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      },
    );

    const decoded = [];
    for (const parsedTransaction of parsedTransactions) {
      if (!parsedTransaction) throw new Error('Transaction not found');

      // Skip errored transactions
      if (parsedTransaction?.meta?.err) continue;

      // Get all transaction's instructions
      const instructions = parsedTransaction.transaction.message.instructions;
      parsedTransaction.meta?.innerInstructions.forEach((innerInstructions) => {
        instructions.push(...innerInstructions.instructions);
      });

      for (const instruction of instructions) {
        const programId = instruction.programId.toBase58();

        if (!this.programIds.includes(programId)) continue;

        const data = GoatSwap.decodeEventOrInstruction(
          instruction.programId.toBase58(),
          instruction['data'],
        );

        if (data) {
          const signature = parsedTransaction.transaction.signatures[0];
          const slot = parsedTransaction.slot;
          const blockTime = parsedTransaction.blockTime;

          decoded.push({
            signature,
            slot,
            blockTime,
            programId,
            data: data,
          });
        }
      }
    }

    return decoded;
  }

  static decodeEventOrInstruction(programId: string, data: any) {
    const instructionData = this._decodeInstruction(programId, data);
    if (instructionData) return instructionData;

    const eventData = this._decodeEvent(programId, data);
    if (eventData) return eventData;

    return null;
  }

  private static _decodeEvent(programId: string, data: any) {
    try {
      const coder = new BorshCoder(SWAP_IDL);

      const ixData = utils.bytes.bs58.decode(data);
      const eventData = utils.bytes.base64.encode(ixData.subarray(8));

      const event = coder.events.decode(eventData);
      if (event) return { type: 'event', programId, ...event };
    } catch (error) {
      console.error(error);
    }

    return null;
  }

  private static _decodeInstruction(programId: string, data: any) {
    try {
      const coder = new BorshCoder(SWAP_IDL);

      const instructionData = coder.instruction.decode(data, 'base58');
      if (instructionData) {
        return { type: 'instruction', programId, ...instructionData };
      }
    } catch (error) {
      console.error(error);
    }

    return null;
  }
}
