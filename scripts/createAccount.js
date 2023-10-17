const bip39 = require("bip39");
const etherHDkey = require("ethereumjs-wallet/hdkey");

async function main() {
  const mnemonic = bip39.generateMnemonic();
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const HDwallet = etherHDkey.fromMasterSeed(seed);
  const zeroWallet = HDwallet.derivePath("m/44'/60'/0'/0/0").getWallet();

  console.log(`Mnemonic: ${mnemonic}`);
  console.log(`Address: ${zeroWallet.getAddressString()}`);
  console.log(`Private Key: ${zeroWallet.getPrivateKeyString()}`);
}

main();
