async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
  
    const TraitBG = await ethers.getContractFactory("TraitBG");
    // For a constant-based contract, no constructor parameters are needed.
    const traitBG = await TraitBG.deploy();
    await traitBG.deployed();
  
    console.log("TraitBG deployed to:", traitBG.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });