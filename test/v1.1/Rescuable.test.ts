import { RescuableInstance } from "../../@types/generated/Rescuable";
import { behavesLikeRescuable } from "./Rescuable.behavior";
import { ZERO_ADDRESS } from "../helpers/constants";

const Rescuable = artifacts.require("Rescuable");

contract("Rescuable", (accounts) => {
  let rescuable: RescuableInstance;

  beforeEach(async () => {
    rescuable = await Rescuable.new();
  });

  behavesLikeRescuable(() => rescuable, accounts);

  it("initially sets rescuer to be the zero address", async () => {
    const rescuer = await rescuable.rescuer();
    expect(rescuer).to.equal(ZERO_ADDRESS);
  });
});
