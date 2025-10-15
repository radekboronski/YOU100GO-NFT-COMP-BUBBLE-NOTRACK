import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Keypair,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  createAllocTreeIx,
} from "@solana/spl-account-compression";
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import type { Y100goBubblegumBadge } from "../target/types/y100go_bubblegum_badge";

// ═══════════════════════════════════════════════════════════
//   🎯 KONFIGURACJA
// ═══════════════════════════════════════════════════════════

// OPCJA 1: ~4000 badges
const MAX_DEPTH = 12;
const MAX_BUFFER_SIZE = 64;
const CANOPY_DEPTH = 0;

// OPCJA 2: ~16000 badges (odkomentuj)
// const MAX_DEPTH = 14;
// const MAX_BUFFER_SIZE = 64;
// const CANOPY_DEPTH = 0;

// ═══════════════════════════════════════════════════════════

const SOL_PRICE = 150;
const formatSol = (lamports: number) => (lamports / LAMPORTS_PER_SOL).toFixed(9);
const formatUsd = (lamports: number, price: number) => 
  ((lamports / LAMPORTS_PER_SOL) * price).toFixed(4);

describe("🏗️ Setup - Merkle Tree", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Y100goBubblegumBadge as anchor.Program<Y100goBubblegumBadge>;
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = provider.wallet as anchor.Wallet;

  it("Utwórz Merkle Tree", async () => {
    console.log("\n" + "=".repeat(70));
    console.log("🏗️  TWORZENIE MERKLE TREE");
    console.log("=".repeat(70));
    console.log(`🌳 Depth: ${MAX_DEPTH} (max ${Math.pow(2, MAX_DEPTH)} leafów)`);
    console.log(`📦 Buffer: ${MAX_BUFFER_SIZE}`);
    console.log(`🌿 Canopy: ${CANOPY_DEPTH}`);
    console.log("=".repeat(70));

    const balanceBefore = await provider.connection.getBalance(payer.publicKey);
    console.log(`\n💰 Balance przed: ${formatSol(balanceBefore)} SOL`);

    // Wygeneruj tree keypair
    const treeKeypair = Keypair.generate();
    const tree = treeKeypair.publicKey;

    console.log(`\n🌳 Tree address: ${tree.toBase58()}`);
    console.log(`📤 Creating tree account...`);

    // Stwórz instruction
    const allocTreeIx = await createAllocTreeIx(
      provider.connection,
      tree,
      payer.publicKey,
      { maxDepth: MAX_DEPTH, maxBufferSize: MAX_BUFFER_SIZE },
      CANOPY_DEPTH
    );

    // Wyślij transakcję
    const tx = new anchor.web3.Transaction().add(allocTreeIx);
    const sig = await provider.sendAndConfirm(tx, [treeKeypair]);

    console.log(`✅ Tree created!`);
    console.log(`   Signature: ${sig}`);

    // Oblicz tree config PDA
    const [treeConfig] = PublicKey.findProgramAddressSync(
      [tree.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    );

    console.log(`\n⚙️  Tree Config PDA: ${treeConfig.toBase58()}`);

    // Zmierz koszt
    const balanceAfter = await provider.connection.getBalance(payer.publicKey);
    const cost = balanceBefore - balanceAfter;

    console.log("\n" + "=".repeat(70));
    console.log("💰 KOSZT MERKLE TREE");
    console.log("=".repeat(70));
    console.log(`Balance przed:   ${formatSol(balanceBefore)} SOL`);
    console.log(`Balance po:      ${formatSol(balanceAfter)} SOL`);
    console.log(`\n💸 TOTAL COST:   ${formatSol(cost)} SOL ($${formatUsd(cost, SOL_PRICE)})`);
    console.log("=".repeat(70));

    console.log("\n📋 ZAPISZ TE ADRESY:");
    console.log("─".repeat(70));
    console.log(`MERKLE_TREE = "${tree.toBase58()}"`);
    console.log(`TREE_CONFIG = "${treeConfig.toBase58()}"`);
    console.log("─".repeat(70));

    console.log("\n⚠️  UWAGA: Tree został utworzony, ale NIE zainicjalizowany!");
    console.log("Musisz go zainicjalizować za pomocą Bubblegum przed użyciem.");
    console.log("\nMożesz to zrobić:");
    console.log("1. Przez Sugar CLI");
    console.log("2. Przez @metaplex-foundation/js SDK");
    console.log("3. Ręcznie przez Bubblegum program\n");

    console.log("=".repeat(70));
    console.log("📊 NASTĘPNE KROKI:");
    console.log("─".repeat(70));
    console.log("1. ✅ Merkle Tree utworzone");
    console.log("2. ⏳ Zainicjalizuj tree przez Bubblegum");
    console.log("3. ⏳ Utwórz Collection NFT");
    console.log("4. ⏳ Inicjalizuj program config");
    console.log("5. ⏳ Mintuj badges!");
    console.log("=".repeat(70));

    // Podsumowanie
    const capacity = Math.pow(2, MAX_DEPTH);
    console.log("\n📊 PRZEWIDYWANE CAŁKOWITE KOSZTY:");
    console.log("─".repeat(70));
    console.log(`Tree (utworzone):        ${formatSol(cost)} SOL`);
    console.log(`Tree init (todo):        ~0.005 SOL (estymacja)`);
    console.log(`Collection NFT (todo):   ~0.020 SOL (estymacja)`);
    console.log(`Program config (todo):   ~0.002 SOL (estymacja)`);
    console.log(`─────────────────────────────────────────`);
    
    const totalEstimated = (cost / LAMPORTS_PER_SOL) + 0.005 + 0.020 + 0.002;
    console.log(`TOTAL ESTIMATED:         ${totalEstimated.toFixed(9)} SOL (~$${(totalEstimated * SOL_PRICE).toFixed(2)})`);
    
    console.log(`\n🎯 Capacity: ${capacity.toLocaleString()} badges`);
    console.log(`💰 Setup cost per badge: ~$${((totalEstimated * SOL_PRICE) / capacity).toFixed(6)}`);
    console.log("=".repeat(70));
  });
});