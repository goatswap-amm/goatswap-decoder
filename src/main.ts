import { Connection } from '@solana/web3.js';
import { GoatSwap } from './goat-swap';
import { Network } from 'goatswap-sdk';

// Change the rpcUrls if you want to use a different network
const rpcUrls = {
  [Network.Mainnet]: 'https://api.mainnet-beta.solana.com',
  [Network.Devnet]: 'https://api.devnet.solana.com',
};

/**
 * Handles the decoding of transactions using the GoatSwap library.
 *
 * @param network - The network to connect to.
 * @param signatures - An array of transaction signatures to decode.
 * @returns A Promise that resolves to the decoded results.
 */
async function handle(network: Network, signatures: string[]) {
  const connection = new Connection(rpcUrls[network], {
    commitment: 'confirmed',
  });

  const results = await GoatSwap.parseTransactions(connection, signatures);

  console.log(results);
}

// Network you want to use
const network = Network.Mainnet;

// Signatures you want to parse
const signatures: string[] = [
  '3prZTe4PGxtKTkkfUCcdZoa51b4vCvth2qqsZwAxT1bffNneSm6Z9EDgnyHnUjBny9GEJw3TaSggE8dLdWaMSFv4',
];

// Run
handle(network, signatures);
