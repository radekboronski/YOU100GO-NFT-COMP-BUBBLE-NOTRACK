import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

// ═══════════════════════════════════════════════════════════
//            🎯 ADRESY Z TWOJEGO SETUPU
// ═══════════════════════════════════════════════════════════

const MERKLE_TREE = "GoXd6iBWw5rR1VhbD9NL6SpH4UZCpWes9fHeg8DFxvhd";
const COLLECTION_MINT = "2KomDBgzYuFpJqVwwp7PPwvSHauPpk9grKpzg4vQd1zz";

// IPFS CID dla metadata
const METADATA_CID = "bafybeib25bo5354yolksyjl4jletfvw6uwahibcvggpnaztb3ajs5walqu";

// ═══════════════════════════════════════════════════════════
//     📝 PARAMETRY BADGE DO ZMINTOWANIA
// ═══════════════════════════════════════════════════════════

const SEASON = 1;       // ← Season (1-80)
const MISSION = 1;      // ← Mission (1-10)
const POSITION = 4;     // ← Position (1-5)

// 👤 OPCJONALNIE: Adres odbiorcy (zostaw puste dla siebie)
const RECIPIENT_WALLET = ""; // Jeśli puste = mintujesz dla siebie

// ═══════════════════════════════════════════════════════════

// Helper functions
const formatSol = (lamports: number): string => {
  return (lamports / 1e9).toFixed(9);
};

const formatUsd = (lamports: number, solPrice: number): string => {
  const sol = lamports / 1e9;
  return (sol * solPrice).toFixed(6);
};

/**
 * Derives Metadata Account PDA for a given mint
 */
const findMetadataAccount = (mint: PublicKey): PublicKey => {
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return metadataAccount;
};

/**
 * Derives Master Edition Account PDA for a given mint
 */
const findEditionAccount = (mint: PublicKey): PublicKey => {
  const [editionAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return editionAccount;
};

/**
 * Derives Program Config PDA for a given collection mint
 */
const findConfigPda = (
  collectionMint: PublicKey,
  programId: PublicKey
): PublicKey => {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), collectionMint.toBuffer()],
    programId
  );
  return configPda;
};

describe("🎨 Mint Badge SMP (Season-Mission-Position)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Y100goBubblegumBadge as Program;
  const payer = provider.wallet as anchor.Wallet;

  it("Mintuj badge używając mint_badge", async () => {
    console.log("\n" + "=".repeat(70));
    console.log("🎨 MINTOWANIE BADGE (METODA SMP)");
    console.log("=".repeat(70));
    
    // Konwertuj na PublicKey
    const merkleTree = new PublicKey(MERKLE_TREE);
    const collectionMint = new PublicKey(COLLECTION_MINT);

    // ═══════════════════════════════════════════════════════════
    //          🔑 DERIVE WSZYSTKIE PDAs PROGRAMMATYCZNIE
    // ═══════════════════════════════════════════════════════════

    console.log("\n🔑 Deriving PDAs...");
    
    // Derive Config PDA
    const configPda = findConfigPda(collectionMint, program.programId);
    console.log(`   Config PDA:      ${configPda.toBase58()}`);

    // Derive Metadata Account
    const metadataAccount = findMetadataAccount(collectionMint);
    console.log(`   Metadata:        ${metadataAccount.toBase58()}`);

    // Derive Edition Account
    const editionAccount = findEditionAccount(collectionMint);
    console.log(`   Edition:         ${editionAccount.toBase58()}`);

    // Derive Tree Config PDA (Bubblegum)
    const [treeConfig] = PublicKey.findProgramAddressSync(
      [merkleTree.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    );
    console.log(`   Tree Config:     ${treeConfig.toBase58()}`);

    // Derive Bubblegum Signer PDA
    const [bubblegumSigner] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_cpi")],
      BUBBLEGUM_PROGRAM_ID
    );
    console.log(`   Bubblegum Signer: ${bubblegumSigner.toBase58()}`);

    // ═══════════════════════════════════════════════════════════
    //          🎯 USTAL ODBIORCĘ I PARAMETRY
    // ═══════════════════════════════════════════════════════════

    let recipientPubkey: PublicKey;
    if (RECIPIENT_WALLET && RECIPIENT_WALLET.trim() !== "") {
      try {
        recipientPubkey = new PublicKey(RECIPIENT_WALLET);
        console.log(`\n👤 ODBIORCA: ${recipientPubkey.toBase58()}`);
        console.log(`💰 PŁATNIK:  ${payer.publicKey.toBase58()}`);
      } catch (error) {
        throw new Error(`❌ Nieprawidłowy adres: ${RECIPIENT_WALLET}`);
      }
    } else {
      recipientPubkey = payer.publicKey;
      console.log(`\n👤 Mintujesz dla siebie: ${recipientPubkey.toBase58()}`);
    }

    console.log("-".repeat(70));
    console.log(`🎯 Season:   ${SEASON}`);
    console.log(`🎯 Mission:  ${MISSION}`);
    console.log(`🎯 Position: ${POSITION}`);
    console.log("-".repeat(70));

    // Oblicz badge number
    const badgeNumber = ((SEASON - 1) * 50) + ((MISSION - 1) * 5) + POSITION;
    console.log(`🔢 Badge Number: #${badgeNumber}`);
    console.log(`🆔 Badge ID: ${SEASON}-${MISSION}-${POSITION}`);

    // Pobierz aktualny stan
    const configData = await program.account.collectionConfig.fetch(configPda);
    const currentMinted = configData.totalMinted.toNumber();
    
    console.log(`\n📊 Current minted: ${currentMinted}`);
    console.log(`📊 This will be #${currentMinted + 1}`);
    console.log(`📊 Max capacity: ${configData.maxCapacity.toString()}`);

    // ═══════════════════════════════════════════════════════════
    //                  💰 POMIAR KOSZTÓW
    // ═══════════════════════════════════════════════════════════

    console.log("\n" + "=".repeat(70));
    console.log("💰 KOSZTY TRANSAKCJI");
    console.log("=".repeat(70));

    const balanceBefore = await provider.connection.getBalance(payer.publicKey);
    console.log(`\n📊 Balans przed: ${formatSol(balanceBefore)} SOL`);

    console.log("\n📤 Sending transaction...\n");

    // Wygeneruj name i URI
    const badgeId = `${SEASON}-${MISSION}-${POSITION}`;
    const name = `YOU100GO Badge #${badgeId}`;
    const uri = `https://green-careful-bison-571.mypinata.cloud/ipfs/${METADATA_CID}/season${SEASON}/mission${MISSION}/${POSITION}.json`;

    console.log(`📝 Name: ${name}`);
    console.log(`🔗 URI:  ${uri}`);

    // MINTUJ!
    let tx: string;
    try {
      tx = await program.methods
        .mintBadge(
          name,    // name: String
          uri      // uri: String
        )
        .accounts({
          config: configPda,
          treeConfig: treeConfig,
          merkleTree: merkleTree,
          payer: payer.publicKey,
          recipient: recipientPubkey,
          collectionMint: collectionMint,
          collectionMetadata: metadataAccount,
          editionAccount: editionAccount,
          bubblegumSigner: bubblegumSigner,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Pobierz balans PO
      const balanceAfter = await provider.connection.getBalance(payer.publicKey);
      console.log(`📊 Balans po:    ${formatSol(balanceAfter)} SOL`);

      // Oblicz koszty
      const totalCost = balanceBefore - balanceAfter;
      
      console.log("\n" + "=".repeat(70));
      console.log("💸 PODSUMOWANIE KOSZTÓW");
      console.log("=".repeat(70));
      console.log(`💰 Total Cost:      ${formatSol(totalCost)} SOL`);
      
      // Pobierz szczegóły transakcji
      try {
        const txDetails = await provider.connection.getTransaction(tx, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (txDetails?.meta) {
          const fee = txDetails.meta.fee;
          
          console.log(`\n📋 Szczegóły:`);
          console.log(`  • Transaction Fee: ${formatSol(fee)} SOL`);
          
          const SOL_PRICE = 150; // Ustaw aktualną cenę SOL
          console.log(`\n💵 W USD (przy SOL = $${SOL_PRICE}):`);
          console.log(`  • Total Cost:      $${formatUsd(totalCost, SOL_PRICE)}`);
          console.log(`  • Transaction Fee: $${formatUsd(fee, SOL_PRICE)}`);
        }
      } catch (error) {
        console.log("\n⚠️  Nie można pobrać szczegółów transakcji");
      }

      console.log("\n" + "=".repeat(70));
      console.log("✅ SUCCESS!");
      console.log("=".repeat(70));
      console.log(`🎨 Badge #${badgeNumber} zmintowany!`);
      console.log(`🆔 ID: ${SEASON}-${MISSION}-${POSITION}`);
      
      if (recipientPubkey.toBase58() !== payer.publicKey.toBase58()) {
        console.log(`\n👤 Badge wysłany do: ${recipientPubkey.toBase58()}`);
      }
      
      console.log(`\n📝 Transaction: ${tx}`);
      console.log(`\n🔗 Explorer:`);
      console.log(`   https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      
      console.log(`\n📄 Metadata:`);
      console.log(`   ${uri}`);
      
      console.log("\n" + "=".repeat(70));
      console.log("💡 INFO:");
      console.log("=".repeat(70));
      console.log("✅ Badge można transferować między portfelami");
      console.log("✅ Badge można sprzedawać na marketplace (Tensor, Magic Eden)");
      console.log("✅ Wszystkie dane są w Merkle Tree + IPFS");
      console.log("✅ Koszt per badge: ~$0.0008 (99.8% taniej niż tradycyjne NFT!)");
      console.log("=".repeat(70));

      console.log("\n" + "=".repeat(70));
      console.log("🔑 DERIVED PDAs (for reference):");
      console.log("=".repeat(70));
      console.log(`Config PDA:      ${configPda.toBase58()}`);
      console.log(`Metadata:        ${metadataAccount.toBase58()}`);
      console.log(`Edition:         ${editionAccount.toBase58()}`);
      console.log(`Tree Config:     ${treeConfig.toBase58()}`);
      console.log(`Bubblegum Signer: ${bubblegumSigner.toBase58()}`);
      console.log("=".repeat(70));

    } catch (error) {
      console.error("\n" + "=".repeat(70));
      console.error("❌ ERROR!");
      console.error("=".repeat(70));
      console.error("Error:", error.message);
      
      if (error.logs) {
        console.error("\n📋 Program Logs:");
        error.logs.forEach(log => console.error(log));
      }
      
      throw error;
    }
  });
});
