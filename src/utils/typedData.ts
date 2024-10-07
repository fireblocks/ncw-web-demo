export const buildTypedData = (
  chainId = 42,
  fromAddress = "0x9EE5e175D09895b8E1E28c22b961345e1dF4B5aE",
  spender = "0xE1B48CddD97Fa4b2F960Ca52A66CeF8f1f8A58A5",
  nonce = 1,
) => ({
  types: {
    EIP712Domain: [
      {
        name: "name",
        type: "string",
      },
      {
        name: "version",
        type: "string",
      },
      {
        name: "chainId",
        type: "uint256",
      },
      {
        name: "verifyingContract",
        type: "address",
      },
    ],
    Permit: [
      {
        name: "holder",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
      {
        name: "nonce",
        type: "uint256",
      },
      {
        name: "expiry",
        type: "uint256",
      },
      {
        name: "allowed",
        type: "bool",
      },
    ],
  },
  primaryType: "Permit",
  domain: {
    name: "Dai Stablecoin",
    version: "1",
    chainId,
    verifyingContract: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa",
  },
  message: {
    holder: fromAddress,
    spender,
    nonce,
    expiry: Math.trunc((Date.now() + 60_000) / 1000),
    allowed: true,
  },
});
