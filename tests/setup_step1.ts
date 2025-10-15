import * as anchor from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";

// ═══════════════════════════════════════════════════════════
//   🎯 KONFIGURACJA - WKLEJ SWOJE ADRESY
// ═══════════════════════════════════════════════════════════

const MERKLE_TREE = "GoXd6iBWw5rR1VhbD9NL6SpH4UZCpWes9fHeg8DFxvhd";

// Parametry (takie same jak przy tworzeniu)
const MAX_DEPTH = 14;
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

  it("Sprawdź status i zainicjalizuj tree", async () => {
    console.log("\n" + "=".repeat(70));
    console.log("🏗️  STEP 2: SPRAWDZANIE I INICJALIZACJA TREE");
    console.log("=".repeat(70));

    const merkleTree = new PublicKey(MERKLE_TREE);

    // Oblicz Tree Config PDA
    const [treeConfig] = PublicKey.findProgramAddressSync(
      [merkleTree.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    );

    console.log(`🌳 Tree:        ${merkleTree.toBase58()}`);
    console.log(`⚙️  Tree Config: ${treeConfig.toBase58()}`);
    console.log(`📊 Depth: ${MAX_DEPTH}, Buffer: ${MAX_BUFFER_SIZE}`);

    // Sprawdź czy tree config już istnieje
    console.log(`\n🔍 Checking if tree is already initialized...`);

    try {
      const treeConfigAccount = await provider.connection.getAccountInfo(treeConfig);
      
      if (treeConfigAccount !== null) {
        console.log("\n✅ Tree Config już istnieje!");
        console.log("─".repeat(70));
        console.log(`Account: ${treeConfig.toBase58()}`);
        console.log(`Owner: ${treeConfigAccount.owner.toBase58()}`);
        console.log(`Size: ${treeConfigAccount.data.length} bytes`);
        console.log(`Lamports: ${formatSol(treeConfigAccount.lamports)} SOL`);
        console.log("─".repeat(70));
        console.log("\n💡 Tree jest już gotowe do użycia!");
        console.log("   Możesz przejść do Step 3 (Collection NFT)");
        console.log("=".repeat(70));
        return; // Skip initialization
      }

      console.log("⚠️  Tree Config nie istnieje - trzeba zainicjalizować");

    } catch (error) {
      console.log("⚠️  Nie można sprawdzić tree config - będziemy próbować zainicjalizować");
    }

    // Tree nie jest zainicjalizowane - inicjalizuj
    console.log("\n📤 Initializing tree config...");

    const balanceBefore = await provider.connection.getBalance(payer.publicKey);
    console.log(`💰 Balance przed: ${formatSol(balanceBefore)} SOL`);

    try {
      // Użyj niskopoziomowego podejścia do stworzenia instrukcji
      const discriminator = Buffer.from([
        165, 83, 136, 142, 89, 202, 47, 220  // create_tree discriminator
      ]);

      const data = Buffer.concat([
        discriminator,
        Buffer.from(new Uint8Array([MAX_DEPTH])),          // max_depth (u32 jako u8)
        Buffer.from(new Uint8Array([0, 0, 0])),            // padding
        Buffer.from(new Uint32Array([MAX_BUFFER_SIZE]).buffer), // max_buffer_size (u32)
        Buffer.from(new Uint8Array([0])),                  // public: false
      ]);

      const keys = [
        { pubkey: treeConfig, isSigner: false, isWritable: true },
        { pubkey: merkleTree, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: payer.publicKey, isSigner: false, isWritable: false }, // tree_creator
        { pubkey: SPL_NOOP_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      const createTreeIx = new anchor.web3.TransactionInstruction({
        keys,
        programId: BUBBLEGUM_PROGRAM_ID,
        data,
      });

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
      console.log("\n📋 Tree jest teraz gotowe:");
      console.log(`   ✅ Tree:        ${merkleTree.toBase58()}`);
      console.log(`   ✅ Tree Config: ${treeConfig.toBase58()}`);
      
      console.log("\n🎯 NASTĘPNY KROK: Step 3 - Utwórz Collection NFT");
      console.log("=".repeat(70));

    } catch (error) {
      console.error("\n❌ Initialization failed!");
      console.error("Error:", error.message);
      
      if (error.logs) {
        console.error("\n📋 Program logs:");
        error.logs.forEach(log => console.error(log));
      }

      console.log("\n💡 Możliwe przyczyny:");
      console.log("   • Tree już zainicjalizowane w poprzedniej próbie");
      console.log("   • Nieprawidłowe parametry (depth/buffer mismatch)");
      console.log("   • Niewystarczające środki");
      console.log("\n💡 Spróbuj sprawdzić tree config ręcznie:");
      console.log(`   solana account ${treeConfig.toBase58()} --url devnet`);
      
      throw error;
    }
  });
});
