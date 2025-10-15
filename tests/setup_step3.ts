import * as anchor from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Metaplex, keypairIdentity, toBigNumber } from "@metaplex-foundation/js";

// ═══════════════════════════════════════════════════════════
//   🎯 KONFIGURACJA COLLECTION
// ═══════════════════════════════════════════════════════════

const COLLECTION_NAME = "YOU100GO Badges";
const COLLECTION_SYMBOL = "Y100GO";
const COLLECTION_URI = "https://green-careful-bison-571.mypinata.cloud/ipfs/bafybeib25bo5354yolksyjl4jletfvw6uwahibcvggpnaztb3ajs5walqu/collection.json";
const SELLER_FEE_BASIS_POINTS = 500; // 5%

// ═══════════════════════════════════════════════════════════

const SOL_PRICE = 150;
const formatSol = (lamports: number) => (lamports / LAMPORTS_PER_SOL).toFixed(9);
const formatUsd = (lamports: number, price: number) => 
  ((lamports / LAMPORTS_PER_SOL) * price).toFixed(4);

describe("🏗️ Step 3 Complete: Collection NFT", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = provider.wallet as anchor.Wallet;

  it("Utwórz kompletną Collection NFT (mint + metadata + edition)", async () => {
    console.log("\n" + "=".repeat(70));
    console.log("🏗️  STEP 3: TWORZENIE KOMPLETNEJ COLLECTION NFT");
    console.log("=".repeat(70));
    console.log(`📝 Name:   ${COLLECTION_NAME}`);
    console.log(`🏷️  Symbol: ${COLLECTION_SYMBOL}`);
    console.log(`🔗 URI:    ${COLLECTION_URI}`);
    console.log(`💰 Royalty: ${SELLER_FEE_BASIS_POINTS / 100}%`);
    console.log("=".repeat(70));

    const balanceBefore = await provider.connection.getBalance(payer.publicKey);
    console.log(`\n💰 Balance przed: ${formatSol(balanceBefore)} SOL`);

    // Utwórz Metaplex instance
    console.log("\n📦 Initializing Metaplex SDK...");
    
    const metaplex = Metaplex.make(provider.connection)
      .use(keypairIdentity(payer.payer));

    console.log("✅ Metaplex initialized");

    // Utwórz Collection NFT (wszystko naraz!)
    console.log("\n🎨 Creating Collection NFT...");
    console.log("   (mint + metadata + master edition)");

    try {
      const { nft, response } = await metaplex.nfts().create({
        uri: COLLECTION_URI,
        name: COLLECTION_NAME,
        sellerFeeBasisPoints: SELLER_FEE_BASIS_POINTS,
        symbol: COLLECTION_SYMBOL,
        creators: [
          {
            address: payer.publicKey,
            share: 100,
          },
        ],
        isMutable: true,
        isCollection: true,
        collectionIsSized: true,
        maxSupply: toBigNumber(0), // Unlimited
      });

      console.log(`✅ Collection NFT created!`);
      console.log(`   Signature: ${response.signature}`);

      const balanceAfter = await provider.connection.getBalance(payer.publicKey);
      const cost = balanceBefore - balanceAfter;

      console.log("\n" + "=".repeat(70));
      console.log("💰 KOSZT COLLECTION NFT");
      console.log("=".repeat(70));
      console.log(`Balance przed:   ${formatSol(balanceBefore)} SOL`);
      console.log(`Balance po:      ${formatSol(balanceAfter)} SOL`);
      console.log(`\n💸 TOTAL COST:   ${formatSol(cost)} SOL ($${formatUsd(cost, SOL_PRICE)})`);
      console.log("=".repeat(70));

      console.log("\n✅ STEP 3 COMPLETE! 🎉");
      console.log("\n📋 ZAPISZ TE ADRESY:");
      console.log("─".repeat(70));
      console.log(`COLLECTION_MINT = "${nft.address.toBase58()}"`);
      console.log(`METADATA_ACCOUNT = "${nft.metadataAddress.toBase58()}"`);
      console.log(`EDITION_ACCOUNT = "${nft.edition.address.toBase58()}"`);
      console.log("─".repeat(70));

      console.log("\n📊 Collection NFT Details:");
      console.log("─".repeat(70));
      console.log(`Name:          ${nft.name}`);
      console.log(`Symbol:        ${nft.symbol}`);
      console.log(`URI:           ${nft.uri}`);
      console.log(`Mint Address:  ${nft.mint.address.toBase58()}`);
      console.log(`Is Collection: ${nft.collection ? 'Yes' : 'No'}`);
      console.log(`Royalty:       ${nft.sellerFeeBasisPoints / 100}%`);
      console.log(`Supply:        ${nft.mint.supply.basisPoints.toString()}`);
      console.log("─".repeat(70));

      console.log("\n🎯 NASTĘPNY KROK: Step 4 - Initialize Program Config");
      console.log("=".repeat(70));

    } catch (error) {
      console.error("\n❌ Collection NFT creation failed!");
      console.error("Error:", error.message);

      if (error.logs) {
        console.error("\n📋 Program logs:");
        error.logs.forEach(log => console.error(log));
      }

      console.log("\n💡 Możliwe przyczyny:");
      console.log("   • Nieprawidłowy URI (JSON musi istnieć i być dostępny)");
      console.log("   • Niewystarczające środki");
      console.log("   • Problem z @metaplex-foundation/js");
      console.log("\n💡 Sprawdź czy URI działa:");
      console.log(`   curl ${COLLECTION_URI}`);

      throw error;
    }
  });
});
