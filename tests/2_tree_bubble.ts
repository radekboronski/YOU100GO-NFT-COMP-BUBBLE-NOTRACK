import * as anchor from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { 
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  createCreateTreeInstruction 
} from "@metaplex-foundation/mpl-bubblegum";

// ═══════════════════════════════════════════════════════════
//   🎯 KONFIGURACJA - WKLEJ SWOJE ADRESY
// ═══════════════════════════════════════════════════════════

const MERKLE_TREE = "6RawATW9QNioLQB7ytwtmnvAaGfo7DahmByNqGsB7Fwp";
const TREE_CONFIG = "FrtQ5ejQMgFMJvGje89Zy6ideZP8traNoKa2qgiHd7zz";

// Parametry (takie same jak przy tworzeniu)
const MAX_DEPTH = 12;
const MAX_BUFFER_SIZE = 64;

// ═══════════════════════════════════════════════════════════

const SOL_PRICE = 150;
const formatSol = (lamports: number) => (lamports / LAMPORTS_PER_SOL).toFixed(9);
const formatUsd = (lamports: number, price: number) => 
  ((lamports / LAMPORTS_PER_SOL) * price).toFixed(4);

describe("🏗️ Step 2: Inicjalizacja Tree", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = provider.wallet as anchor.Wallet;

  it("Inicjalizuj Bubblegum Tree Config", async () => {
    console.log("\n" + "=".repeat(70));
    console.log("🏗️  STEP 2: INICJALIZACJA BUBBLEGUM TREE");
    console.log("=".repeat(70));

    const merkleTree = new PublicKey(MERKLE_TREE);
    const treeConfig = new PublicKey(TREE_CONFIG);

    console.log(`🌳 Tree:        ${merkleTree.toBase58()}`);
    console.log(`⚙️  Tree Config: ${treeConfig.toBase58()}`);
    console.log(`📊 Depth: ${MAX_DEPTH}, Buffer: ${MAX_BUFFER_SIZE}`);

    const balanceBefore = await provider.connection.getBalance(payer.publicKey);
    console.log(`\n💰 Balance przed: ${formatSol(balanceBefore)} SOL`);

    console.log(`\n📤 Initializing tree config...`);

    try {
      // Utwórz instruction do inicjalizacji tree
      const createTreeIx = createCreateTreeInstruction(
        {
          treeConfig: treeConfig,
          merkleTree: merkleTree,
          payer: payer.publicKey,
          treeCreator: payer.publicKey,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        },
        {
          maxDepth: MAX_DEPTH,
          maxBufferSize: MAX_BUFFER_SIZE,
          public: false,
        }
      );

      const tx = new anchor.web3.Transaction().add(createTreeIx);
      const sig = await provider.sendAndConfirm(tx);

      console.log(`✅ Tree initialized!`);
      console.log(`   Signature: ${sig}`);

      const balanceAfter = await provider.connection.getBalance(payer.publicKey);
      const cost = balanceBefore - balanceAfter;

      console.log("\n" + "=".repeat(70));
      console.log("💰 KOSZT INICJALIZACJI");
      console.log("=".repeat(70));
      console.log(`Balance przed:   ${formatSol(balanceBefore)} SOL`);
      console.log(`Balance po:      ${formatSol(balanceAfter)} SOL`);
      console.log(`\n💸 TOTAL COST:   ${formatSol(cost)} SOL ($${formatUsd(cost, SOL_PRICE)})`);
      console.log("=".repeat(70));

      console.log("\n✅ STEP 2 COMPLETE!");
      console.log("\n📋 Masz teraz:");
      console.log(`   ✅ Tree utworzone:        ${merkleTree.toBase58()}`);
      console.log(`   ✅ Tree zainicjalizowane: ${treeConfig.toBase58()}`);
      
      console.log("\n🎯 NASTĘPNY KROK: Step 3 - Utwórz Collection NFT");
      console.log("=".repeat(70));

    } catch (error) {
      console.error("\n❌ Initialization failed!");
      console.error("Error:", error.message);
      
      if (error.logs) {
        console.error("\n📋 Program logs:");
        error.logs.forEach(log => console.error(log));
      }

      // Sprawdź czy tree już zainicjalizowane
      console.log("\n💡 Możliwe przyczyny:");
      console.log("   • Tree już zainicjalizowane (to OK!)");
      console.log("   • Nieprawidłowe parametry");
      console.log("   • Niewystarczające środki");
      
      throw error;
    }
  });
});

