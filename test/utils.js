//Utility function to deploy a contract
async function DeployContract(name, args = []) {
    const factory = await ethers.getContractFactory(name);
    const contract = await factory.deploy(...args);
    return contract;
};

module.exports = {
    DeployContract
};