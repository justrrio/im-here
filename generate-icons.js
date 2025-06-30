const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Icon sizes needed for various platforms
const iconSizes = [
  { name: "icon.png", size: 1024 },
  { name: "adaptive-icon.png", size: 1024 },
  { name: "favicon.png", size: 256 },
  { name: "splash-icon.png", size: 512 },
];

async function generateIcons() {
  const svgPath = path.join(__dirname, "assets", "images", "location-icon.svg");
  const outputDir = path.join(__dirname, "assets", "images");

  console.log("🎨 Generating app icons...");

  try {
    // Read SVG file
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate each icon size
    for (const iconConfig of iconSizes) {
      const outputPath = path.join(outputDir, iconConfig.name);

      await sharp(svgBuffer)
        .resize(iconConfig.size, iconConfig.size)
        .png()
        .toFile(outputPath);

      console.log(
        `✅ Generated ${iconConfig.name} (${iconConfig.size}x${iconConfig.size})`
      );
    }

    console.log("🎉 All icons generated successfully!");
  } catch (error) {
    console.error("❌ Error generating icons:", error);
  }
}

generateIcons();
