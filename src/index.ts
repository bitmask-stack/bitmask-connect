// index.ts - BitMask External API SDK
// A comprehensive library for interacting with the BitMask browser extension

export interface BitMaskResponse {
  returnid: string;
  [key: string]: any;
}

export interface BitMaskError {
  error: string;
  errorTitle?: string;
  errorMessage?: string;
}

export type BitMaskCallback = (
  response: BitMaskResponse | BitMaskError,
) => void;

/**
 * BitMask SDK - External API for dApps
 * Provides a clean interface to interact with the BitMask browser extension
 */
export class BitMaskSDK {
  private listeners: Map<string, BitMaskCallback> = new Map();
  private currentPubKeyHash: string = "";

  constructor() {
    // Set up global message listener
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;

      if (event.data.returnid) {
        const callback = this.listeners.get(event.data.returnid);
        if (callback) {
          callback(event.data);
          this.listeners.delete(event.data.returnid);
        }
      }
    });
  }

  /**
   * Generate unique ID for tracking requests
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Send message to BitMask extension
   */
  private sendMessage(data: any, callback?: BitMaskCallback): string {
    const id = this.generateId();
    const messageData = {
      ...data,
      dateId: id,
    };

    if (callback) {
      this.listeners.set(id, callback);
    }

    window.postMessage(messageData, "*");
    return id;
  }

  // ===== BITCOIN/RGB METHODS =====

  /**
   * Connect to BitMask wallet and get public key hash
   * Returns wallet_id (pubKeyHash), "0" if not authenticated, "-1" if no wallet
   */
  async getVault(title?: string, description?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "get_vault",
          title: title || "Connect Wallet",
          description:
            description || "Connect your BitMask wallet to this application",
          pubkeyHash: "",
        },
        (response) => {
          if ("wallet_id" in response) {
            if (response.wallet_id !== "0" && response.wallet_id !== "-1") {
              this.currentPubKeyHash = response.wallet_id;
            }
            resolve(response.wallet_id);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Get BitMask username for the connected wallet
   */
  async getUsername(pubkeyHash?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "get_username",
          title: "Get Username",
          description: "Retrieve your BitMask username",
          pubkeyHash: pubkeyHash || this.currentPubKeyHash,
        },
        (response) => {
          if ("username" in response) {
            resolve(response.username);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Issue (mint) a new RGB21 UDA (Unique Digital Asset/NFT)
   */
  async issueUDA(params: {
    name: string;
    description: string;
    ticker?: string;
    image?: string;
    meta?: any;
    iface?: string;
    bitcoinPrice?: number;
    option?: "mint" | "transfer" | "Unlisted";
    pubkeyHash?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "issue_uda",
          title: "Mint NFT",
          description: `Create RGB21 asset: ${params.name}`,
          pubkeyHash: params.pubkeyHash || this.currentPubKeyHash,
          uda: {
            name: params.name,
            description: params.description,
            ticker: params.ticker || params.name.substring(0, 8).toUpperCase(),
            image: params.image,
            meta: params.meta,
            iface: params.iface || "RGB21",
            supply: 1,
          },
          bitcoinPrice: params.bitcoinPrice || 0,
          option: params.option || "mint",
        },
        (response) => {
          if ("issueResponse" in response) {
            resolve({
              issueResponse: JSON.parse(response.issueResponse),
              swapResponse: response.swapResponse
                ? JSON.parse(response.swapResponse)
                : null,
              network: response.network,
            });
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Create a swap offer to trade assets
   */
  async createSwapOffer(params: {
    contractId: string;
    contractAmount?: string;
    bitcoinPrice: number;
    pubkeyHash?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "swap_offer",
          title: "Create Swap Offer",
          description: "Offer your asset for trade",
          pubkeyHash: params.pubkeyHash || this.currentPubKeyHash,
          offerData: {
            contractId: params.contractId,
            contractAmount: params.contractAmount || "1",
            bitcoinPrice: params.bitcoinPrice,
          },
        },
        (response) => {
          if ("swapResponse" in response) {
            resolve(JSON.parse(response.swapResponse));
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Cancel an existing swap offer
   * NOT IMPLEMENTED IN EXTENSION
   */
  async cancelSwapOffer(params: {
    offerId: string;
    pubkeyHash?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "cancel_swap_offer",
          title: "Cancel Swap Offer",
          description: "Cancel your swap offer",
          pubkeyHash: params.pubkeyHash || this.currentPubKeyHash,
          offerData: {
            offerId: params.offerId,
          },
        },
        (response) => {
          if ("cancelSwapResponse" in response) {
            resolve(JSON.parse(response.cancelSwapResponse));
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Create a bid on an existing swap offer
   */
  async createSwapBid(params: {
    bundleId: string;
    offerId: string;
    bitcoinPrice: number;
    pubkeyHash?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "swap_bid",
          title: "Place Bid",
          description: "Bid on a swap offer",
          pubkeyHash: params.pubkeyHash || this.currentPubKeyHash,
          bidData: {
            bundleId: params.bundleId,
            offerId: params.offerId,
            bitcoinPrice: params.bitcoinPrice,
          },
        },
        (response) => {
          if ("swapResponse" in response) {
            resolve({
              swapResponse: JSON.parse(response.swapResponse),
              network: response.network,
            });
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Cancel an existing swap bid
   * NOT IMPLEMENTED IN EXTENSION
   */
  async cancelSwapBid(params: {
    bidId: string;
    pubkeyHash?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "cancel_swap_bid",
          title: "Cancel Bid",
          description: "Cancel your bid",
          pubkeyHash: params.pubkeyHash || this.currentPubKeyHash,
          bidData: {
            bidId: params.bidId,
          },
        },
        (response) => {
          if ("cancelSwapResponse" in response) {
            resolve(JSON.parse(response.cancelSwapResponse));
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Generate an RGB invoice for asset transfer
   * NOT IMPLEMENTED IN EXTENSION
   */
  async getInvoice(params: {
    assetId: string;
    amount?: number;
    pubkeyHash?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "get_invoice",
          title: "Generate Invoice",
          description: "Create RGB invoice for asset transfer",
          pubkeyHash: params.pubkeyHash || this.currentPubKeyHash,
          uda: {
            assetId: params.assetId,
            amount: params.amount || 1,
          },
        },
        (response) => {
          if ("invoiceResponse" in response) {
            resolve(JSON.parse(response.invoiceResponse));
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Accept an incoming asset transfer
   * NOT IMPLEMENTED IN EXTENSION
   */
  async acceptAsset(params: {
    invoice: string;
    pubkeyHash?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "accept_asset",
          title: "Accept Asset",
          description: "Accept incoming asset transfer",
          pubkeyHash: params.pubkeyHash || this.currentPubKeyHash,
          invoice: params.invoice,
        },
        (response) => {
          if ("acceptResponse" in response) {
            resolve(JSON.parse(response.acceptResponse));
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Pass asset data to wallet (internal use)
   * NOT IMPLEMENTED IN EXTENSION
   */
  async passAsset(params: { udaData: any; pubkeyHash?: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "pass_asset",
          pubkeyHash: params.pubkeyHash || this.currentPubKeyHash,
          udaData: JSON.stringify(params.udaData),
        },
        (response) => {
          if ("txid" in response) {
            resolve(response);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Transfer an asset (internal use)
   * NOT IMPLEMENTED IN EXTENSION
   */
  async transfer(params: { udaData: any; pubkeyHash?: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "transfer",
          pubkeyHash: params.pubkeyHash || this.currentPubKeyHash,
          udaData: JSON.stringify(params.udaData),
        },
        (response) => {
          if ("consignment" in response) {
            resolve(response);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  // ===== UTILITY METHODS =====

  /**
   * Get wallet public key hash and network
   */
  async getPubKeyHash(): Promise<{ pubkeyHash: string; network: string }> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "get_pubkeyhash",
        },
        (response) => {
          if (
            "pubkeyHash" in response &&
            response.pubkeyHash !== "0" &&
            response.pubkeyHash !== "-1"
          ) {
            resolve({
              pubkeyHash: response.pubkeyHash,
              network: response.network || "bitcoin",
            });
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Check if wallet is funded
   */
  async isFunded(pubkeyHash?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "is_funded",
          pubkeyHash: pubkeyHash || this.currentPubKeyHash,
        },
        (response) => {
          if ("isLogged" in response) {
            resolve(response.isLogged && response.isFunded);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Get wallet Bitcoin address
   */
  async getAddress(pubkeyHash?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "get_address",
          pubkeyHash: pubkeyHash || this.currentPubKeyHash,
        },
        (response) => {
          if ("address" in response && response.isLogged) {
            resolve(response.address);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Send a browser notification
   */
  sendNotification(title: string, message: string): void {
    this.sendMessage({
      call: "send_notification",
      title: title,
      message: message,
    });
  }

  // ===== EVM/ROOTSTOCK METHODS =====

  /**
   * Request user permission to connect EVM accounts
   * Returns array of approved account addresses
   */
  async evmRequestAccounts(origin?: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_requestAccounts",
          title: "Connect Account",
          description: "Connect your Rootstock account to this dApp",
          pubkeyHash: this.currentPubKeyHash,
          params: [],
          origin: origin || window.location.origin,
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Get currently connected EVM accounts without prompting
   */
  async evmGetAccounts(origin?: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_accounts",
          title: "Get Accounts",
          description: "Get connected accounts",
          pubkeyHash: this.currentPubKeyHash,
          origin: origin || window.location.origin,
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Request specific wallet permissions
   * NOT IMPLEMENTED IN EXTENSION
   */
  async walletRequestPermissions(permissions: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "wallet_requestPermissions",
          title: "Request Permissions",
          description: "Grant permissions to this dApp",
          pubkeyHash: this.currentPubKeyHash,
          params: permissions,
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Get current permissions for the calling origin
   * NOT IMPLEMENTED IN EXTENSION
   */
  async walletGetPermissions(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "wallet_getPermissions",
          title: "Get Permissions",
          description: "View current permissions",
          pubkeyHash: this.currentPubKeyHash,
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Sign and send an EVM transaction
   */
  async evmSendTransaction(params: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
    nonce?: string;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_sendTransaction",
          title: "Send Transaction",
          description: "Sign and send transaction",
          pubkeyHash: this.currentPubKeyHash,
          params: [params],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Sign a transaction without broadcasting
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmSignTransaction(params: any): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_signTransaction",
          title: "Sign Transaction",
          description: "Sign transaction",
          pubkeyHash: this.currentPubKeyHash,
          params: [params],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Send a raw signed transaction
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmSendRawTransaction(signedTx: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_sendRawTransaction",
          title: "Send Raw Transaction",
          description: "Broadcast signed transaction",
          pubkeyHash: this.currentPubKeyHash,
          params: [signedTx],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Sign a message with personal_sign method
   */
  async personalSign(message: string, account: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Convert message to hex if it's not already
      const messageHex = message.startsWith("0x")
        ? message
        : "0x" +
          Array.from(message, (c) =>
            c.charCodeAt(0).toString(16).padStart(2, "0"),
          ).join("");

      this.sendMessage(
        {
          call: "personal_sign",
          title: "Sign Message",
          description: "Sign a personal message",
          pubkeyHash: this.currentPubKeyHash,
          params: [messageHex, account],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Basic EVM signing (deprecated, use personalSign)
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmSign(data: string, account: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_sign",
          title: "Sign Data",
          description: "Sign data (deprecated method)",
          pubkeyHash: this.currentPubKeyHash,
          params: [account, data],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Sign typed data according to EIP-712
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmSignTypedDataV4(typedData: any, account: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_signTypedData_v4",
          title: "Sign Typed Data",
          description: "Sign structured data",
          pubkeyHash: this.currentPubKeyHash,
          params: [account, JSON.stringify(typedData)],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Sign typed data v3 (older version)
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmSignTypedDataV3(typedData: any, account: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_signTypedData_v3",
          title: "Sign Typed Data",
          description: "Sign structured data (v3)",
          pubkeyHash: this.currentPubKeyHash,
          params: [account, JSON.stringify(typedData)],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Switch to a different EVM chain
   */
  async walletSwitchEvmChain(chainId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "wallet_switchEvmChain",
          title: "Switch Network",
          description: "Switch to a different network",
          pubkeyHash: this.currentPubKeyHash,
          params: [{ chainId }],
        },
        (response) => {
          if (response.error) {
            reject(response);
          } else {
            resolve();
          }
        },
      );
    });
  }

  /**
   * Add a custom EVM chain
   */
  async walletAddEvmChain(chainParams: {
    chainId: string;
    chainName: string;
    nativeCurrency?: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[];
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "wallet_addEvmChain",
          title: "Add Network",
          description: `Add ${chainParams.chainName} network`,
          pubkeyHash: this.currentPubKeyHash,
          params: [chainParams],
        },
        (response) => {
          if (response.error) {
            reject(response);
          } else {
            resolve();
          }
        },
      );
    });
  }

  /**
   * Get current EVM chain ID
   */
  async evmChainId(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_chainId",
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Add a token to wallet's token list
   * NOT IMPLEMENTED IN EXTENSION
   */
  async walletWatchAsset(params: {
    type: string;
    options: {
      address: string;
      symbol: string;
      decimals: number;
      image?: string;
    };
  }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "wallet_watchAsset",
          title: "Add Token",
          description: `Add ${params.options.symbol} token`,
          pubkeyHash: this.currentPubKeyHash,
          params: params,
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Get public encryption key for an account
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmGetEncryptionPublicKey(account: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_getEncryptionPublicKey",
          title: "Get Encryption Key",
          description: "Get public encryption key",
          pubkeyHash: this.currentPubKeyHash,
          params: [account],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Decrypt a message encrypted with the account's public key
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmDecrypt(encryptedData: string, account: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_decrypt",
          title: "Decrypt Message",
          description: "Decrypt encrypted message",
          pubkeyHash: this.currentPubKeyHash,
          params: [encryptedData, account],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Get RBTC balance of an address
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmGetBalance(address: string, blockNumber?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_getBalance",
          title: "Get Balance",
          description: "Get RBTC balance",
          pubkeyHash: this.currentPubKeyHash,
          params: [address, blockNumber || "latest"],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Get current block number
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmBlockNumber(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_blockNumber",
          title: "Get Block Number",
          description: "Get current block number",
          pubkeyHash: this.currentPubKeyHash,
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Get current gas price
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmGasPrice(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_gasPrice",
          title: "Get Gas Price",
          description: "Get current gas price",
          pubkeyHash: this.currentPubKeyHash,
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Estimate gas for a transaction
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmEstimateGas(txParams: any): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_estimateGas",
          title: "Estimate Gas",
          description: "Estimate gas for transaction",
          pubkeyHash: this.currentPubKeyHash,
          params: [txParams],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Execute a contract call without creating a transaction
   * NOT IMPLEMENTED IN EXTENSION
   */
  async evmCall(
    callParams: {
      to: string;
      data: string;
      from?: string;
      gas?: string;
      gasPrice?: string;
      value?: string;
    },
    blockNumber?: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          call: "evm_call",
          title: "Contract Call",
          description: "Execute contract call",
          pubkeyHash: this.currentPubKeyHash,
          params: [callParams, blockNumber || "latest"],
        },
        (response) => {
          if ("result" in response) {
            resolve(response.result);
          } else {
            reject(response);
          }
        },
      );
    });
  }

  /**
   * Create a RainbowKit custom connector for BitMask
   * This method returns a connector configuration that can be used with RainbowKit
   *
   * @param options - Configuration options for the connector
   * @returns RainbowKit connector configuration object
   */
  createRainbowKitConnector(options?: {
    name?: string;
    iconUrl?: string;
    iconBackground?: string;
  }) {
    const sdk = this;

    return {
      id: "bitmask",
      name: options?.name || "BitMask",
      iconUrl:
        options?.iconUrl ||
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iI0Y3OTMxQSIvPgo8cGF0aCBkPSJNMTYgNkMxMC40NzcgNiA2IDEwLjQ3NyA2IDE2QzYgMjEuNTIzIDEwLjQ3NyAyNiAxNiAyNkMyMS41MjMgMjYgMjYgMjEuNTIzIDI2IDE2QzI2IDEwLjQ3NyAyMS41MjMgNiAxNiA2WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2IDlDMTIuMTM0IDkgOSAxMi4xMzQgOSAxNkM5IDE5Ljg2NiAxMi4xMzQgMjMgMTYgMjNDMTkuODY2IDIzIDIzIDE5Ljg2NiAyMyAxNkMyMyAxMi4xMzQgMTkuODY2IDkgMTYgOVoiIGZpbGw9IiNGNzkzMUEiLz4KPC9zdmc+",
      iconBackground: options?.iconBackground || "#F7931A",

      createConnector: () => {
        return {
          connector: {
            connect: async () => {
              try {
                // First connect to BitMask wallet
                const walletId = await sdk.getVault(
                  "Connect BitMask",
                  "Connect your BitMask wallet to this dApp",
                );

                if (walletId === "0") {
                  throw new Error("User rejected connection");
                }

                if (walletId === "-1") {
                  throw new Error("No BitMask wallet found");
                }

                // Then request EVM accounts
                const accounts = await sdk.evmRequestAccounts();

                if (!accounts || accounts.length === 0) {
                  throw new Error("No accounts available");
                }

                // Get chain ID
                const chainId = await sdk.evmChainId();

                return {
                  accounts: accounts as `0x${string}`[],
                  chainId: parseInt(chainId, 16),
                };
              } catch (error) {
                throw error;
              }
            },

            disconnect: async () => {
              // BitMask doesn't have a disconnect method, so we just clear local state
              sdk.currentPubKeyHash = "";
            },

            getAccounts: async () => {
              const accounts = await sdk.evmGetAccounts();
              return accounts as `0x${string}`[];
            },

            getChainId: async () => {
              const chainId = await sdk.evmChainId();
              return parseInt(chainId, 16);
            },

            isAuthorized: async () => {
              try {
                const accounts = await sdk.evmGetAccounts();
                return accounts && accounts.length > 0;
              } catch {
                return false;
              }
            },

            switchChain: async ({ chainId }: { chainId: number }) => {
              await sdk.walletSwitchEvmChain(`0x${chainId.toString(16)}`);
              return { id: chainId, unsupported: false } as any;
            },

            onAccountsChanged: (callback: (accounts: string[]) => void) => {
              // BitMask doesn't expose account change events directly
              // You might need to poll or implement this based on BitMask's capabilities
              const handler = (event: MessageEvent) => {
                if (event.data.type === "accountsChanged") {
                  callback(event.data.accounts);
                }
              };
              window.addEventListener("message", handler);
              return () => window.removeEventListener("message", handler);
            },

            onChainChanged: (callback: (chainId: string) => void) => {
              // BitMask doesn't expose chain change events directly
              // You might need to poll or implement this based on BitMask's capabilities
              const handler = (event: MessageEvent) => {
                if (event.data.type === "chainChanged") {
                  callback(event.data.chainId);
                }
              };
              window.addEventListener("message", handler);
              return () => window.removeEventListener("message", handler);
            },

            onDisconnect: (callback: () => void) => {
              // BitMask doesn't expose disconnect events directly
              const handler = (event: MessageEvent) => {
                if (event.data.type === "disconnect") {
                  callback();
                }
              };
              window.addEventListener("message", handler);
              return () => window.removeEventListener("message", handler);
            },
          },
        };
      },
    };
  }
}

// Export a singleton instance
export const bitmask = new BitMaskSDK();

// Also export the class for custom instances
export default BitMaskSDK;
