import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

// ═══════════════════════════════════════════════════════════
//   🎯 KONFIGURACJA - WKLEJ SWOJE ADRESY
// ═══════════════════════════════════════════════════════════

const MERKLE_TREE = "GoXd6iBWw5rR1VhbD9NL6SpH4UZCpWes9fHeg8DFxvhd"; // Z Step 2
const COLLECTION_MINT = "2KomDBgzYuFpJqVwwp7PPwvSHauPpk9grKpzg4vQd1zz"; // Z Step 3
const MAX_CAPACITY = 16384; // Depth 14

// ═══════════════════════════════════════════════════════════

const SOL_PRICE = 150;
const formatSol = (lamports: number) => (lamports / LAMPORTS_PER_SOL).toFixed(9);
const formatUsd = (lamports: number, price: number) => 
  ((lamports / LAMPORTS_PER_SOL) * price).toFixed(4);

describe("🏗️ Step 4: Program Config", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Y100goBubblegumBadge as Program;
  const payer = provider.wallet as anchor.Wallet;

  it("Inicjalizuj Program Config", async () => {
    console.log("\n" + "=".repeat(70));
    console.log("🏗️  STEP 4: INICJALIZACJA PROGRAM CONFIG");
    console.log("=".repeat(70));

    // Walidacja
    if (COLLECTION_MINT === "WKLEJ_TUTAJ_COLLECTION_MINT") {
      throw new Error("❌ Musisz ustawić COLLECTION_MINT z Step 3!");
    }

    const merkleTree = new PublicKey(MERKLE_TREE);
    const collectionMint = new PublicKey(COLLECTION_MINT);

    console.log(`🌳 Merkle Tree:     ${merkleTree.toBase58()}`);
    console.log(`🎨 Collection Mint: ${collectionMint.toBase58()}`);
    console.log(`📊 Max Capacity:    ${MAX_CAPACITY.toLocaleString()}`);

    // Oblicz Config PDA
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), collectionMint.toBuffer()],
      program.programId
    );

    console.log(`⚙️  Config PDA:      ${configPda.toBase58()}`);

    const balanceBefore = await provider.connection.getBalance(payer.publicKey);
    console.log(`\n💰 Balance przed: ${formatSol(balanceBefore)} SOL`);

    console.log(`\n📤 Initializing config...`);

    try {
      const tx = await program.methods
        .initializeCollection(new anchor.BN(MAX_CAPACITY))
        .accounts({
          config: configPda,
          collectionMint: collectionMint,
          merkleTree: merkleTree,
          payer: payer.publicKey,
          authority: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`✅ Config initialized!`);
      console.log(`   Signature: ${tx}`);

      const balanceAfter = await provider.connection.getBalance(payer.publicKey);
      const cost = balanceBefore - balanceAfter;

      console.log("\n" + "=".repeat(70));
      console.log("💰 KOSZT INICJALIZACJI CONFIG");
      console.log("=".repeat(70));
      console.log(`Balance przed:   ${formatSol(balanceBefore)} SOL`);
      console.log(`Balance po:      ${formatSol(balanceAfter)} SOL`);
      console.log(`\n💸 TOTAL COST:   ${formatSol(cost)} SOL ($${formatUsd(cost, SOL_PRICE)})`);
      console.log("=".repeat(70));

      // Sprawdź config
      const configData = await program.account.collectionConfig.fetch(configPda);
      
      console.log("\n📋 CONFIG DETAILS:");
      console.log("─".repeat(70));
      console.log(`Authority:       ${configData.authority.toBase58()}`);
      console.log(`Collection Mint: ${configData.collectionMint.toBase58()}`);
      console.log(`Total Minted:    ${configData.totalMinted.toString()}`);
      console.log(`Max Capacity:    ${configData.maxCapacity.toString()}`);
      console.log("─".repeat(70));

      console.log("\n✅ SETUP COMPLETE! 🎉");
      console.log("=".repeat(70));
      console.log("\n📋 ZAPISZ WSZYSTKIE ADRESY:");
      console.log("─".repeat(70));
      console.log(`MERKLE_TREE = "${merkleTree.toBase58()}"`);
      console.log(`COLLECTION_MINT = "${collectionMint.toBase58()}"`);
      console.log(`CONFIG_PDA = "${configPda.toBase58()}"`);
      console.log("─".repeat(70));

      console.log("\n🎯 GOTOWE DO MINTOWANIA!");
      console.log("Możesz teraz użyć skryptu mintowania badge'ów.");
      console.log("=".repeat(70));

    } catch (error) {
      console.error("\n❌ Config initialization failed!");
      console.error("Error:", error.message);

      if (error.logs) {
        console.error("\n📋 Program logs:");
        error.logs.forEach(log => console.error(log));
      }

      console.log("\n💡 Możliwe przyczyny:");
      console.log("   • Config już istnieje (spróbuj z innym collection mint)");
      console.log("   • Nieprawidłowy collection mint");
      console.log("   • Niewystarczające środki");

      throw error;
    }
  });
});
