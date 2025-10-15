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
//            🎯 KONFIGURACJA
// ═══════════════════════════════════════════════════════════

const MERKLE_TREE = "GoXd6iBWw5rR1VhbD9NL6SpH4UZCpWes9fHeg8DFxvhd";
const COLLECTION_MINT = "2KomDBgzYuFpJqVwwp7PPwvSHauPpk9grKpzg4vQd1zz";
const METADATA_CID = "bafybeib25bo5354yolksyjl4jletfvw6uwahibcvggpnaztb3ajs5walqu";

// ═══════════════════════════════════════════════════════════
//     👤 ODBIORCA BADGE - WKLEJ ADRES UŻYTKOWNIKA
// ═══════════════════════════════════════════════════════════

const USER_WALLET = "5cK1XahQaAibQ1TywJtfwH5aQGwtCV4ThU9zMWAodx99"; // ← WKLEJ ADRES

// ═══════════════════════════════════════════════════════════
//     📝 PARAMETRY BADGE
// ═══════════════════════════════════════════════════════════

const SEASON = 1;       // ← Season (1-80)
const MISSION = 1;      // ← Mission (1-10)
const POSITION = 3;     // ← Position (1-5)

// ═══════════════════════════════════════════════════════════

const formatSol = (lamports: number): string => {
  return (lamports / 1e9).toFixed(9);
};

const formatUsd = (lamports: number, solPrice: number): string => {
  const sol = lamports / 1e9;
  return (sol * solPrice).toFixed(6);
};

// Helper functions for deriving PDAs
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

describe("🎁 Mint Badge Directly to User Wallet", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Y100goBubblegumBadge as Program;
  const payer = provider.wallet as anchor.Wallet;

  it("Mintuj badge bezpośrednio do portfela użytkownika", async () => {
    console.log("\n" + "=".repeat(70));
    console.log("🎁 MINTOWANIE BADGE DLA UŻYTKOWNIKA");
    console.log("=".repeat(70));
    
    // ═══════════════════════════════════════════════════════════
    //   ✅ WALIDACJA
    // ═══════════════════════════════════════════════════════════

    if (!USER_WALLET || USER_WALLET.trim() === "") {
      console.error("\n❌ ERROR: Musisz ustawić USER_WALLET!");
      console.log("\n💡 Wklej adres portfela użytkownika do zmiennej USER_WALLET");
      throw new Error("USER_WALLET is required");
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(USER_WALLET);
    } catch (error) {
      throw new Error(`❌ Nieprawidłowy adres portfela: ${USER_WALLET}`);
    }

    console.log("\n👥 UCZESTNICY:");
    console.log("─".repeat(70));
    console.log(`💰 PŁATNIK (TY):        ${payer.publicKey.toBase58()}`);
    console.log(`🎁 ODBIORCA (USER):     ${userPubkey.toBase58()}`);
    console.log("─".repeat(70));
    
    console.log("\n💡 TY płacisz za mint (~$0.0008)");
    console.log("💡 USER dostaje badge do swojego portfela");
    console.log("💡 USER NIE musi nic robić, nic podpisywać!");

    // ═══════════════════════════════════════════════════════════
    //   🔑 DERIVE PDAs
    // ═══════════════════════════════════════════════════════════

    const merkleTree = new PublicKey(MERKLE_TREE);
    const collectionMint = new PublicKey(COLLECTION_MINT);

    console.log("\n🔑 Deriving PDAs...");
    
    const configPda = findConfigPda(collectionMint, program.programId);
    const metadataAccount = findMetadataAccount(collectionMint);
    const editionAccount = findEditionAccount(collectionMint);

    const [treeConfig] = PublicKey.findProgramAddressSync(
      [merkleTree.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    );

    const [bubblegumSigner] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_cpi")],
      BUBBLEGUM_PROGRAM_ID
    );

    console.log(`   Config PDA:       ${configPda.toBase58()}`);
    console.log(`   Tree Config:      ${treeConfig.toBase58()}`);

    // ═══════════════════════════════════════════════════════════
    //   📊 BADGE INFO
    // ═══════════════════════════════════════════════════════════

    console.log("\n📊 BADGE DO ZMINTOWANIA:");
    console.log("─".repeat(70));
    console.log(`🎯 Season:   ${SEASON}`);
    console.log(`🎯 Mission:  ${MISSION}`);
    console.log(`🎯 Position: ${POSITION}`);

    const badgeNumber = ((SEASON - 1) * 50) + ((MISSION - 1) * 5) + POSITION;
    const badgeId = `${SEASON}-${MISSION}-${POSITION}`;
    
    console.log(`🔢 Badge Number: #${badgeNumber}`);
    console.log(`🆔 Badge ID: ${badgeId}`);
    console.log("─".repeat(70));

    // Pobierz aktualny stan
    const configData = await program.account.collectionConfig.fetch(configPda);
    const currentMinted = configData.totalMinted.toNumber();
    
    console.log(`\n📊 Collection Status:`);
    console.log(`   Already minted: ${currentMinted}`);
    console.log(`   This will be:   #${currentMinted + 1}`);
    console.log(`   Max capacity:   ${configData.maxCapacity.toString()}`);

    // ═══════════════════════════════════════════════════════════
    //   💰 MEASURE COST
    // ═══════════════════════════════════════════════════════════

    console.log("\n" + "=".repeat(70));
    console.log("💰 KOSZTY TRANSAKCJI");
    console.log("=".repeat(70));

    const balanceBefore = await provider.connection.getBalance(payer.publicKey);
    console.log(`\n💵 Twój balans przed: ${formatSol(balanceBefore)} SOL`);

    // Generate metadata
    const name = `YOU100GO Badge #${badgeId}`;
    const uri = `https://green-careful-bison-571.mypinata.cloud/ipfs/${METADATA_CID}/season${SEASON}/mission${MISSION}/${POSITION}.json`;

    console.log(`\n📝 Badge metadata:`);
    console.log(`   Name: ${name}`);
    console.log(`   URI:  ${uri}`);

    // ═══════════════════════════════════════════════════════════
    //   🚀 MINT!
    // ═══════════════════════════════════════════════════════════

    console.log("\n📤 Sending mint transaction...");
    console.log("⏳ Please wait...\n");

    let tx: string;
    try {
      tx = await program.methods
        .mintBadge(name, uri)
        .accounts({
          config: configPda,
          treeConfig: treeConfig,
          merkleTree: merkleTree,
          payer: payer.publicKey,              // ← TY płacisz
          recipient: userPubkey,                // ← USER dostaje badge!
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

      // Measure cost
      const balanceAfter = await provider.connection.getBalance(payer.publicKey);
      const totalCost = balanceBefore - balanceAfter;
      
      console.log("=".repeat(70));
      console.log("💸 PODSUMOWANIE KOSZTÓW");
      console.log("=".repeat(70));
      console.log(`💵 Twój balans po:  ${formatSol(balanceAfter)} SOL`);
      console.log(`💰 Koszt mintu:     ${formatSol(totalCost)} SOL`);
      
      // Get transaction details
      try {
        const txDetails = await provider.connection.getTransaction(tx, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (txDetails?.meta) {
          const fee = txDetails.meta.fee;
          const SOL_PRICE = 150;
          
          console.log(`\n📋 Szczegóły:`);
          console.log(`   Transaction Fee: ${formatSol(fee)} SOL`);
          console.log(`\n💵 W USD (przy SOL = $${SOL_PRICE}):`);
          console.log(`   Koszt mintu: $${formatUsd(totalCost, SOL_PRICE)}`);
        }
      } catch (error) {
        // Ignore if we can't fetch tx details
      }

      // ═══════════════════════════════════════════════════════════
      //   ✅ SUCCESS!
      // ═══════════════════════════════════════════════════════════

      console.log("\n" + "=".repeat(70));
      console.log("✅ SUCCESS! BADGE ZMINTOWANY I WYSŁANY!");
      console.log("=".repeat(70));
      
      console.log(`\n🎨 Badge #${badgeNumber} (${badgeId})`);
      console.log(`\n👤 Owner: ${userPubkey.toBase58()}`);
      console.log(`💰 Zapłaciłeś: ${formatSol(totalCost)} SOL (~$${formatUsd(totalCost, 150)})`);
      
      console.log(`\n📝 Transaction:`);
      console.log(`   ${tx}`);
      
      console.log(`\n🔗 Solana Explorer:`);
      console.log(`   https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      
      console.log(`\n👛 User może zobaczyć badge w portfelu:`);
      console.log(`   https://explorer.solana.com/address/${userPubkey.toBase58()}?cluster=devnet`);
      
      console.log(`\n📄 Metadata URI:`);
      console.log(`   ${uri}`);

      console.log("\n" + "=".repeat(70));
      console.log("💡 CO DALEJ:");
      console.log("=".repeat(70));
      console.log("✅ Badge jest teraz w portfelu użytkownika");
      console.log("✅ User może zobaczyć badge w Phantom/Solflare");
      console.log("✅ User może transferować badge (wymaga DAS API lub canopy)");
      console.log("✅ User może sprzedać badge na Tensor/Magic Eden");
      console.log("✅ Ty dostaniesz 5% royalty przy każdej sprzedaży!");
      console.log("=".repeat(70));

      console.log("\n" + "=".repeat(70));
      console.log("🔑 TECHNICAL INFO:");
      console.log("=".repeat(70));
      console.log(`Config PDA:       ${configPda.toBase58()}`);
      console.log(`Tree Config:      ${treeConfig.toBase58()}`);
      console.log(`Merkle Tree:      ${merkleTree.toBase58()}`);
      console.log(`Collection:       ${collectionMint.toBase58()}`);
      console.log(`Leaf Index:       ${currentMinted} (badge position in tree)`);
      console.log("=".repeat(70));

    } catch (error) {
      console.error("\n" + "=".repeat(70));
      console.error("❌ MINT FAILED!");
      console.error("=".repeat(70));
      console.error("Error:", error.message);
      
      if (error.logs) {
        console.error("\n📋 Program Logs:");
        error.logs.forEach(log => console.error(log));
      }

      console.log("\n💡 Możliwe przyczyny:");
      console.log("   • Nieprawidłowy adres USER_WALLET");
      console.log("   • Collection jest pełna (max capacity)");
      console.log("   • Niewystarczające środki na koncie");
      console.log("   • Tree nie jest zainicjalizowane");
      console.log("   • Nieprawidłowy Season/Mission/Position");
      
      throw error;
    }
  });
});

// ═══════════════════════════════════════════════════════════
//   📋 INSTRUKCJE UŻYCIA
// ═══════════════════════════════════════════════════════════
/*

🎯 JAK UŻYĆ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. USTAW USER_WALLET:
   const USER_WALLET = "adres_portfela_użytkownika";

2. USTAW PARAMETRY BADGE:
   const SEASON = 1;
   const MISSION = 1;
   const POSITION = 5;

3. URUCHOM:
   anchor test tests/mint_to_user.ts

4. GOTOWE! Badge jest w portfelu użytkownika!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 KLUCZOWE INFORMACJE:

✅ TY płacisz za mint (~$0.0008)
✅ USER dostaje badge do swojego portfela
✅ USER NIE musi nic robić, nic podpisywać
✅ USER NIE musi być online
✅ Badge od razu w jego portfelu
✅ USER może go zobaczyć w Phantom/Solflare

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎁 USE CASES:

1. AIRDROP:
   • Rozdaj badge wszystkim użytkownikom
   • Zmień USER_WALLET dla każdego
   • Uruchom skrypt wielokrotnie

2. NAGRODY:
   • User ukończył mission
   • Mintuj badge bezpośrednio do niego
   • Automatyczna nagroda!

3. SPRZEDAŻ:
   • User kupił badge na Twojej stronie
   • Mintuj dla niego po payment
   • Instant delivery!

4. WHITELIST:
   • User jest na whitelist
   • Mintuj dla niego automatycznie
   • Nie musi się o nic martwić

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 KOSZT:

• Mint cost: ~0.00008 SOL (~$0.012)
• Transaction fee: ~0.000005 SOL
• TOTAL per badge: ~$0.012

Dla 1000 użytkowników: ~$12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 BULK MINTING (dla wielu userów):

Możesz zrobić skrypt który czyta listę adresów:

const users = [
  "wallet1...",
  "wallet2...",
  "wallet3...",
];

for (const userWallet of users) {
  await mintBadgeToUser(userWallet, season, mission, position);
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*/
