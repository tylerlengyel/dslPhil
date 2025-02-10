// scripts/deploy_traits.js
async function main() {
  // Get the deployer from Hardhat's ethers provider.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy TraitBG
  const TraitBG = await ethers.getContractFactory("TraitBG");
  const traitBG = await TraitBG.deploy();
  await traitBG.deployed();
  console.log("TraitBG deployed at:", traitBG.address);

  // Deploy TraitColor
  const TraitColor = await ethers.getContractFactory("TraitColor");
  const traitColor = await TraitColor.deploy();
  await traitColor.deployed();
  console.log("TraitColor deployed at:", traitColor.address);

  // Deploy TraitWings
  const TraitWings = await ethers.getContractFactory("TraitWings");
  const traitWings = await TraitWings.deploy();
  await traitWings.deployed();
  console.log("TraitWings deployed at:", traitWings.address);

  // Deploy TraitPhil
  const TraitPhil = await ethers.getContractFactory("TraitPhil");
  const traitPhil = await TraitPhil.deploy();
  await traitPhil.deployed();
  console.log("TraitPhil deployed at:", traitPhil.address);

  // Deploy TraitSpikes
  const TraitSpikes = await ethers.getContractFactory("TraitSpikes");
  const traitSpikes = await TraitSpikes.deploy();
  await traitSpikes.deployed();
  console.log("TraitSpikes deployed at:", traitSpikes.address);

  // Deploy TraitEyes (multi-part trait)
  const TraitEyes = await ethers.getContractFactory("TraitEyes");
  const traitEyes = await TraitEyes.deploy();
  await traitEyes.deployed();
  console.log("TraitEyes deployed at:", traitEyes.address);

  // Deploy TraitTop
  const TraitTop = await ethers.getContractFactory("TraitTop");
  const traitTop = await TraitTop.deploy();
  await traitTop.deployed();
  console.log("TraitTop deployed at:", traitTop.address);

  // Deploy TraitTeeth (multi-part trait)
  const TraitTeeth = await ethers.getContractFactory("TraitTeeth");
  const traitTeeth = await TraitTeeth.deploy();
  await traitTeeth.deployed();
  console.log("TraitTeeth deployed at:", traitTeeth.address);

  // Deploy TraitNose
  const TraitNose = await ethers.getContractFactory("TraitNose");
  const traitNose = await TraitNose.deploy();
  await traitNose.deployed();
  console.log("TraitNose deployed at:", traitNose.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });