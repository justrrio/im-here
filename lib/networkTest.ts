// Simple network test for debugging map tiles issue
// This can help determine if the problem is network-related

export const testNetworkConnectivity = async () => {
  console.log("🧪 Starting network connectivity tests...");

  const testUrls = [
    // Basic internet test
    "https://www.google.com",

    // Tile servers
    "https://tile.openstreetmap.org/1/0/0.png",
    "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/1/0/0.png",
    "https://maps.wikimedia.org/osm-intl/1/0/0.png",
  ];

  const results = [];

  for (const url of testUrls) {
    try {
      console.log(`🔗 Testing: ${url}`);
      const startTime = Date.now();

      const response = await fetch(url, {
        method: "HEAD",
        cache: "no-cache",
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        url,
        status: response.status,
        ok: response.ok,
        duration: `${duration}ms`,
        headers: Object.fromEntries(response.headers.entries()),
      };

      results.push(result);

      if (response.ok) {
        console.log(`✅ ${url} - Status: ${response.status} (${duration}ms)`);
      } else {
        console.log(`❌ ${url} - Status: ${response.status} (${duration}ms)`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`💥 ${url} - Error: ${errorMessage}`);
      results.push({
        url,
        error: errorMessage,
      });
    }
  }

  console.log("📊 Test Results Summary:", results);

  // Check if basic internet works
  const googleTest = results.find((r) => r.url.includes("google.com"));
  if (googleTest && "ok" in googleTest && googleTest.ok) {
    console.log("✅ Internet connectivity: OK");
  } else {
    console.log("❌ Internet connectivity: FAILED");
    console.log("📱 Emulator might not have internet access");
    console.log(
      "💡 Try: Cold boot emulator, check proxy settings, or use device"
    );
  }

  // Check tile servers
  const tileTests = results.filter((r) => r.url.includes(".png"));
  const workingTiles = tileTests.filter((r) => "ok" in r && r.ok);

  if (workingTiles.length > 0) {
    console.log(
      `✅ Working tile servers: ${workingTiles.length}/${tileTests.length}`
    );
    workingTiles.forEach((tile) => {
      console.log(`  ✅ ${tile.url}`);
    });
  } else {
    console.log("❌ No tile servers are accessible");
    console.log("💡 This explains why map tiles appear white/blank");
  }

  return results;
};

export const testSpecificTileUrl = async (
  templateUrl: string,
  z = 1,
  x = 0,
  y = 0
) => {
  const testUrl = templateUrl
    .replace("{z}", z.toString())
    .replace("{x}", x.toString())
    .replace("{y}", y.toString())
    .replace("{s}", "a"); // for subdomain templates

  console.log(`🎯 Testing specific tile: ${testUrl}`);

  try {
    const response = await fetch(testUrl);
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response ok: ${response.ok}`);
    console.log(`📊 Content-Type: ${response.headers.get("content-type")}`);
    console.log(`📊 Content-Length: ${response.headers.get("content-length")}`);

    if (response.ok) {
      console.log("✅ Tile loaded successfully");
      return true;
    } else {
      console.log("❌ Tile failed to load");
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`💥 Tile test error: ${errorMessage}`);
    return false;
  }
};
