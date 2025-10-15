import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";

// TWOJE ADRESY:
const COLLECTION_MINT = "7tAVMRJ8xkbgwDiDTR7z2QL6cNWAzTofPRjaXiMXcmn8";
const NEW_COLLECTION_URI = "https://green-careful-bison-571.mypinata.cloud/ipfs/bafybeicd347rif4gzwgcvjjuztaflz3sqw5mj7anozjymhskruqc2hw7vm/season1/mission1/collection.json";

describe("🔄 Update Collection Metadata", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const payer = provider.wallet as anchor.Wallet;

  it("Zaktualizuj URI collection NFT", async () => {
    console.log("\n🔄 AKTUALIZACJA COLLECTION METADATA");
    console.log("Collection Mint:", COLLECTION_MINT);
    console.log("Nowy URI:", NEW_COLLECTION_URI);
    
    const collectionMint = new PublicKey(COLLECTION_MINT);
    
    // Initialize Metaplex
    const metaplex = Metaplex.make(provider.connection)
      .use(keypairIdentity(payer.payer));
    
    // Load existing collection NFT
    console.log("\n📊 Loading collection NFT...");
    const collection = await metaplex.nfts().findByMint({
      mintAddress: collectionMint,
    });
    
    console.log("✅ Collection loaded:");
    console.log("   Name:", collection.name);
    console.log("   Current URI:", collection.uri);
    
    // Update metadata
    console.log("\n📤 Updating metadata...");
    const { response } = await metaplex.nfts().update({
      nftOrSft: collection,
      uri: NEW_COLLECTION_URI,
    });
    
    console.log("\n✅ COLLECTION METADATA ZAKTUALIZOWANE!");
    console.log("   Transaction:", response.signature);
    console.log("   Nowy URI:", NEW_COLLECTION_URI);
    
    console.log("\n💡 Sprawdź w explorer:");
    console.log(`   https://explorer.solana.com/address/${COLLECTION_MINT}?cluster=devnet`);

    // Poczekaj chwilę na propagację
    console.log("\n⏳ Oczekiwanie 3 sekundy na propagację...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Weryfikacja
    console.log("\n🔍 WERYFIKACJA:");
    const updatedCollection = await metaplex.nfts().findByMint({
      mintAddress: collectionMint,
    });
    console.log("   URI zapisane on-chain:", updatedCollection.uri);

    // Fetch metadata z nowego URI
    try {
      const metadataResponse = await fetch(NEW_COLLECTION_URI);
      const metadata = await metadataResponse.json();
      console.log("   Obrazek w nowym metadata:", metadata.image);
      
      // Oblicz pełny URL obrazka
      const imageUrl = metadata.image.startsWith('http') 
        ? metadata.image 
        : NEW_COLLECTION_URI.replace('collection.json', metadata.image);
      
      console.log("   Pełny URL obrazka:", imageUrl);
      console.log("\n🖼️  Sprawdź obrazek bezpośrednio:");
      console.log(`   ${imageUrl}`);
    } catch (error) {
      console.log("   ⚠️ Nie można pobrać metadata:", error.message);
    }
  });
});
