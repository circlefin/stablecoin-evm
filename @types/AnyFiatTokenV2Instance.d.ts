import {
  FiatTokenV2Instance,
  FiatTokenV21Instance,
  FiatTokenV22Instance,
} from "./generated";

export interface FiatTokenV22InstanceExtended extends FiatTokenV22Instance {
  permit?: typeof FiatTokenV2Instance.permit;
  transferWithAuthorization?: typeof FiatTokenV2Instance.transferWithAuthorization;
  receiveWithAuthorization?: typeof FiatTokenV2Instance.receiveWithAuthorization;
  cancelAuthorization?: typeof FiatTokenV2Instance.cancelAuthorization;
}

export type AnyFiatTokenV2Instance =
  | FiatTokenV2Instance
  | FiatTokenV21Instance
  | FiatTokenV22InstanceExtended;
