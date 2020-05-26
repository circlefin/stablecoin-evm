import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";

const FiatTokenV1 = artifacts.require("FiatTokenV1");

contract("FiatTokenV1", (accounts) => {
  usesOriginalStorageSlotPositions({
    Contract: FiatTokenV1,
    version: 1,
    accounts,
  });
});
