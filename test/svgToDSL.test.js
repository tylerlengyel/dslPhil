const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const { processSvgFile, processTraitFiles } = require("../svgToDSL");

describe("SVG to DSL Conversion", function () {
  // Create a temporary folder for our test SVGs.
  const testFolder = path.join(__dirname, "temp");
  before(() => {
    if (!fs.existsSync(testFolder)) {
      fs.mkdirSync(testFolder);
    }
  });
  after(() => {
    // Clean up the temporary folder after tests.
    fs.rmSync(testFolder, { recursive: true, force: true });
  });

  it("should process a single SVG file correctly", async function () {
    const sampleSvg = `<svg viewBox="0 0 10 10">
      <circle cx="5" cy="5" r="4" fill="red"/>
    </svg>`;
    const tempFile = path.join(testFolder, "sample_single.svg");
    fs.writeFileSync(tempFile, sampleSvg, "utf8");

    const dslHex = await processSvgFile(tempFile);
    // Basic assertion: the DSL hex string must be non-empty.
    expect(dslHex).to.be.a("string").and.not.empty;
  });

  it("should process multiple SVG files for a trait correctly", async function () {
    const sampleSvg1 = `<svg viewBox="0 0 10 10">
      <circle cx="5" cy="5" r="4" fill="red"/>
    </svg>`;
    const sampleSvg2 = `<svg viewBox="0 0 10 10">
      <rect x="1" y="1" width="8" height="8" fill="blue"/>
    </svg>`;
    const tempFile1 = path.join(testFolder, "sample_multi1.svg");
    const tempFile2 = path.join(testFolder, "sample_multi2.svg");
    fs.writeFileSync(tempFile1, sampleSvg1, "utf8");
    fs.writeFileSync(tempFile2, sampleSvg2, "utf8");

    const traitDsl = await processTraitFiles([tempFile1, tempFile2]);
    // Expect the output to be non-empty and consist of two space-separated parts.
    const parts = traitDsl.split(" ");
    expect(parts).to.have.lengthOf(2);
    parts.forEach((part) => expect(part).to.be.a("string").and.not.empty);
  });
});