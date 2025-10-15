const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════
// PARAMETRY - TYLKO TO ZMIEŃ!
// ═══════════════════════════════════════════════════════════

const PARAMS = {
  season: 1,      // ← ZMIEŃ
  mission: 1,     // ← ZMIEŃ
  images_cid: "bafybeigbzhtzzglhchc7q3frrswrr2bde334c3kc9t4mssvrpbeqzpma"  // ← ZMIEŃ
};

const OUTPUT_DIR = "./metadata";

const BADGES = [
  { position: 1, rarity: "Common" },
  { position: 2, rarity: "Common" },
  { position: 3, rarity: "Rare" },
  { position: 4, rarity: "Rare" },
  { position: 5, rarity: "Legendary" }
];

// ═══════════════════════════════════════════════════════════
// GENERATOR
// ═══════════════════════════════════════════════════════════

function generateMetadata() {
  console.log("🚀 Y100GO Badge Metadata Generator");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Season ${PARAMS.season}, Mission ${PARAMS.mission}`);
  console.log(`Images CID: ${PARAMS.images_cid}\n`);

  const missionDir = path.join(
    OUTPUT_DIR,
    `season${PARAMS.season}`,
    `mission${PARAMS.mission}`
  );

  if (!fs.existsSync(missionDir)) {
    fs.mkdirSync(missionDir, { recursive: true });
  }

  BADGES.forEach(badge => {
    const badgeId = `${PARAMS.season}-${PARAMS.mission}-${badge.position}`;
    const imageUri = `https://green-careful-bison-571.mypinata.cloud/ipfs/bafybeigbzhtzgihchc7q3frrswwrzbde534clc36cg4jamsxvrp6qezpma/${badge.position}.png`;

    const metadata = {
      name: `Y100GO Badge #${badgeId}`,
      symbol: "Y100BADGE",
      description: `Season ${PARAMS.season}, Mission ${PARAMS.mission}`,
      image: imageUri,
      attributes: [
        { trait_type: "Badge ID", value: badgeId },
        { trait_type: "Season", value: PARAMS.season.toString() },
        { trait_type: "Mission", value: PARAMS.mission.toString() },
        { trait_type: "Position", value: badge.position.toString() },
        { trait_type: "Rarity", value: badge.rarity }
      ]
    };

    const filename = path.join(missionDir, `${badge.position}.json`);
    fs.writeFileSync(filename, JSON.stringify(metadata, null, 2));

    console.log(`✅ Badge #${badgeId} (${badge.rarity.padEnd(10)}) → ${badge.position}.json`);
  });

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`🎉 Generated 5 metadata files`);
  console.log(`📂 ${path.resolve(missionDir)}\n`);
}

generateMetadata();
