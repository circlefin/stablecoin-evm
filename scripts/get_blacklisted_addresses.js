// run with `yarn truffle exec scripts/get_blacklisted_addresses.js --network mainnet`
const fs = require("fs");

const FiatTokenV2_1 = require("../build/contracts/FiatTokenV2_1.json");
const mainnetAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const originBlock = 6082465;
const queryWindow = 30000;

module.exports = async function (callback) {
  try {
    const fiatTokenV2_1 = new web3.eth.Contract(
      FiatTokenV2_1.abi,
      mainnetAddress
    );
    const currentBlock = await web3.eth.getBlockNumber();

    const blacklistedEvents = [];
    let fromBlock = originBlock;
    let toBlock = originBlock + queryWindow;
    while (toBlock < currentBlock) {
      console.log(`querying events from ${fromBlock} to ${toBlock}`);
      const events = await grabEventsWithRetryAsync(
        fiatTokenV2_1,
        2,
        fromBlock,
        toBlock
      );

      if (events.length > 0) {
        console.log("found events!");
        blacklistedEvents.push(...events);
        events.map((event) =>
          console.log(event.blockNumber, event.returnValues._account)
        );
      }

      fromBlock = toBlock + 1;
      toBlock = Math.min(currentBlock, toBlock + queryWindow);

      // sleep for 200 ms
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const currentlyBlacklistedAddresses = [];

    // for each blacklist event, make sure the address is still blacklisted
    for (const blacklistedEvent of blacklistedEvents) {
      const isCurrentlyBlacklisted = await fiatTokenV2_1.methods
        .isBlacklisted(blacklistedEvent.returnValues._account)
        .call();

      if (isCurrentlyBlacklisted) {
        currentlyBlacklistedAddresses.push(
          blacklistedEvent.returnValues._account
        );
      }
    }

    console.log("Currently Blacklisted Addresses:");
    console.log(currentlyBlacklistedAddresses);

    const outputJson = {
      asOfBlock: currentBlock,
      blacklistedAddress: currentlyBlacklistedAddresses,
    };
    fs.writeFileSync(
      "scripts/blacklisted_addresses.json",
      JSON.stringify(outputJson),
      "utf8",
      (err) => {
        if (err) throw err;
        console.log("blacklist file saved");
      }
    );
  } catch (error) {
    console.log(error);
  }

  callback();
};

async function grabEventsWithRetryAsync(
  contract,
  maxRetries,
  fromBlock,
  toBlock
) {
  let tries = 0;

  while (tries < maxRetries) {
    try {
      return await contract.getPastEvents("Blacklisted", {
        fromBlock,
        toBlock,
      });
    } catch (e) {
      console.log(e);
      tries += 1;
    }
  }

  throw new Error("retries exceeded");
}
