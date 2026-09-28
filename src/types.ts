export interface AttributeData {
  age_over_18?: boolean;
  [key: string]: any;
}

export interface DisclosedAttributesResponse {
  attributes?: {
    [key: string]: {
      attributes?: {
        [key: string]: AttributeData;
      };
      issuerUri?: string;
      ca?: string;
      validityInfo?: {
        signed?: string;
        validFrom?: string;
        validUntil?: string;
      };
    };
  };
}

export interface NLWalletButtonProps {
  label?: string;
  /** Current name for the registration's identifier; wins over `clientId`. */
  serviceId?: string;
  /** @deprecated Use `serviceId`. Still fully supported. */
  clientId?: string;
  onSuccess: (attributes: AttributeData | undefined) => void;
  apiKey?: string;
  walletConnectHost?: string;
  lang?: string;
}