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
  clientId: string;
  onSuccess: (attributes: AttributeData | undefined) => void;
  apiKey?: string;
  walletConnectHost?: string;
}