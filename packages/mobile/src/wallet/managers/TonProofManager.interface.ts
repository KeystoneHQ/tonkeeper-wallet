export interface SignedProof {
  address: string;
  proof: {
    timestamp: number;
    domain: {
      length_bytes: number;
      value: string;
    };
    signature: string,
    payload: string;
    state_init: string;
  };
}
