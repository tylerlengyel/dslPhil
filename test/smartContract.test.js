const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TraitBG Contract", function () {
  let traitBG;
  // Replace with the expected DSL hex (without the "0x" prefix) that you hardcoded in your contract.
  const expectedDSLHex = "c040deadbeef"; // example placeholder

  before(async function () {
    const TraitBG = await ethers.getContractFactory("TraitBG");
    traitBG = await TraitBG.deploy();
    await traitBG.deployed();
  });

  it("should return the correct DSL hex data", async function () {
    const dslHexBytes = await traitBG.getDSLHex();
    // ethers.utils.hexlify converts the bytes array to a hex string.
    const returnedHex = ethers.utils.hexlify(dslHexBytes).substring(2); // remove "0x"
    expect(returnedHex).to.equal(expectedDSLHex);
  });
});