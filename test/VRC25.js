const { ethers } = require("hardhat")
const { expect } = require("chai");


function splitSignature(sig) {
    const r = sig.slice(0, 66);  // 32 bytes, 66 hex characters
    const s = '0x' + sig.slice(66, 130);  // 32 bytes, 64 hex characters
    const v = parseInt(sig.slice(130, 132), 16);  // recovery id

    return { v, r, s };
}

describe("vrc25 test", function () {
    let VRC25;
    let vrc25;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    const name = "VRC25-Origin.sol Token";
    const symbol = "VRC25-Origin.sol";
    const decimals = 18;
    const version = "1";

    beforeEach(async function () {
        // get account address
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        // 部署 VRC25-Origin.sol 合约
        VRC25 = await ethers.getContractFactory("VRC25");
        vrc25 = await VRC25.deploy(name, symbol, decimals, version);
        await vrc25.waitForDeployment();
    });

    it("Should have the correct name and symbol", async function () {
        expect(await vrc25.name()).to.equal(name);
        expect(await vrc25.symbol()).to.equal(symbol);
    });

    it("Should assign the total supply to the owner", async function () {
        const totalSupply = await vrc25.totalSupply();
        const ownerBalance = await vrc25.balanceOf(owner.address);
        expect(ownerBalance).to.equal(totalSupply);
    });

    it("Should transfer tokens from owner to addr1", async function () {
        const transferAmount = ethers.parseUnits("100", 18); // 100 tokens

        await vrc25.mint(owner.address, ethers.parseUnits("1000", 18));
        await vrc25.transfer(addr1.address, transferAmount);

        expect(await vrc25.balanceOf(owner.address)).to.equal(
            ethers.parseUnits("900", 18)
        );
        expect(await vrc25.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should fail if sender has insufficient balance", async function () {
        const transferAmount = ethers.parseUnits("1000", 18);

        await expect(vrc25.connect(addr1).transfer(addr2.address, transferAmount)).to.be.revertedWith(
            "VRC25-Origin.sol: insuffient balance"
        );
    });

    it("Should approve allowance correctly", async function () {
        const approveAmount = ethers.parseUnits("100", 18);

        await vrc25.approve(addr1.address, approveAmount);

        expect(await vrc25.allowance(owner.address, addr1.address)).to.equal(approveAmount);
    });

    it("Should transfer tokens using allowance", async function () {
        const approveAmount = ethers.parseUnits("100", 18);
        const transferAmount = ethers.parseUnits("50", 18);

        vrc25.mint(owner.address,ethers.parseUnits("1000", 18))
        // Approve addr1 to spend tokens
        await vrc25.approve(addr1.address, approveAmount);

        // Transfer using `transferFrom`
        await vrc25.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

        expect(await vrc25.balanceOf(owner.address)).to.equal(
            ethers.parseUnits("950", 18)
        );
        expect(await vrc25.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should transfer ownership", async function () {
        await vrc25.transferOwnership(addr1.address);

        expect(await vrc25.owner()).to.equal(owner.address);
    });

    it("Should accept ownership transfer", async function () {
        await vrc25.transferOwnership(addr1.address);
        await vrc25.connect(addr1).acceptOwnership();
        expect(await vrc25.owner()).to.equal(addr1.address);
    });

    it("Should set and get min fee", async function () {
        const newFee = 50;
        await vrc25.setFee(newFee);
        expect(await vrc25.minFee()).to.equal(newFee);
    });

    it("Should estimate fee correctly", async function () {
        const transferAmount = 5000000;
        const newFee = 50;
        await vrc25.setFee(newFee);
        const fee = await vrc25.estimateFee(transferAmount);
        let estimateFee = transferAmount + newFee;
        expect(fee).to.equal(estimateFee); // assuming the minFee is set to 50 in the contract
    });

    it("Should burn tokens correctly", async function () {
        vrc25.mint(owner.address,ethers.parseUnits("1000", 18))
        const burnAmount = ethers.parseUnits("100", 18);
        await vrc25.burn(burnAmount);
        expect(await vrc25.totalSupply()).to.equal(ethers.parseUnits("900", 18));
    });

    it("Should permit spender to transfer tokens", async function () {
        const value = ethers.parseUnits("100", 18);
        const deadline = Math.floor(Date.now() / 1000) + 60; // 1 minute expiry
        const nonce = await vrc25.nonces(owner.address);
        const domain = {
            name: await vrc25.name(),
            version: "1",
            chainId: await ethers.provider.getNetwork().then((network) => network.chainId),
            verifyingContract: vrc25.target,
        };

        const permitData = {
            owner: owner.address,
            spender: addr1.address,
            value,
            nonce,
            deadline,
        };
        const signature = await owner.signTypedData(domain, { Permit: [ { name: "owner", type: "address" }, { name: "spender", type: "address" }, { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" } ] }, permitData);
        const {  v, r, s } = splitSignature(signature);
        await vrc25.permit(owner.address, addr1.address, value, deadline, v, r, s);

        const allowance = await vrc25.allowance(owner.address, addr1.address);
        expect(allowance).to.equal(value);
    });

})
