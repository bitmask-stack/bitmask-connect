type AnyFn = (...args: any[]) => void;
type BitmaskConnectOptions = {
    timeoutMs?: number;
    targetOrigin?: string;
};
type Network = string;
type UDA = unknown;
type GetVaultResponse = {
    returnid: string;
    wallet_id: string;
    errorTitle?: string;
    errorMessage?: string;
};
type GetUsernameResponse = {
    returnid: string;
    txid: string;
    username?: string;
};
type IssueUdaResponse = {
    returnid: string;
    txid: string;
    issueResponse?: unknown;
    swapResponse?: unknown;
    network?: Network;
    errorTitle?: string;
    errorMessage?: string;
};
type IssueAssetResponse = IssueUdaResponse;
type BulkIssueUdaResponse = IssueUdaResponse;
type GetInvoiceResponse = {
    returnid: string;
    txid: string;
    invoiceResponse?: unknown;
};
type AcceptAssetResponse = {
    returnid: string;
    txid: string;
    acceptResponse?: unknown;
};
type SwapOfferResponse = {
    returnid: string;
    txid: string;
    swapOfferResponse?: unknown;
    checkSwapResponse?: unknown;
};
type CancelSwapOfferResponse = {
    returnid: string;
    txid: string;
    cancelSwapResponse?: unknown;
};
type SwapBidResponse = {
    returnid: string;
    transaction?: unknown;
    swapResponse?: unknown;
    checkSwapResponse?: unknown;
    network?: Network;
    errorTitle?: string;
    errorMessage?: string;
};
type CancelSwapBidResponse = {
    returnid: string;
    txid: string;
    cancelSwapResponse?: unknown;
};
type GetAssetsResponse = {
    returnid: string | null;
    assets?: unknown[];
    error?: string;
    test?: unknown;
};
type PassAssetResponse = {
    returnid: string;
    txid: string;
    vout: number;
};
type TransferResponse = {
    returnid: string;
    txid: string;
    vout: number;
    consignment: string;
    id?: string;
};
type GetPubKeyHashResponse = {
    returnid: string;
    pubkeyHash: string;
    network?: Network;
} | {
    returnid: string;
    pubkeyHash: "0" | "-1";
};
type IsFundedResponse = {
    returnid: string;
    isLogged: false;
} | {
    returnid: string;
    isLogged: true;
    isFunded: boolean;
};
type GetAddressResponse = {
    returnid: string;
    isLogged: false;
} | {
    returnid: string;
    isLogged: true;
    address?: string;
};
type RefreshEvent = {
    refresh: true;
};
type EventName = "refresh";
declare class BitmaskConnect {
    private pending;
    private listeners;
    private timeoutMs;
    private targetOrigin;
    private boundOnMessage;
    constructor(opts?: BitmaskConnectOptions);
    dispose(): void;
    on(event: EventName, handler: AnyFn): () => void;
    off(event: EventName, handler: AnyFn): void;
    private emit;
    private onWindowMessage;
    private send;
    detect(timeoutMs?: number): Promise<boolean>;
    getVault(params?: {
        title?: string;
        description?: string;
        pubkeyHash?: string;
        uid?: string;
    }): Promise<GetVaultResponse>;
    getUsername(params?: {
        title?: string;
        description?: string;
        pubkeyHash?: string;
        uid?: string;
    }): Promise<GetUsernameResponse>;
    issueUDA(params: {
        title?: string;
        description?: string;
        pubkeyHash?: string;
        uid?: string;
        uda: UDA & {
            bitcoinPrice?: number;
            option?: string | number;
        };
    }): Promise<IssueUdaResponse>;
    bulkIssueUDA(params: {
        title?: string;
        description?: string;
        pubkeyHash?: string;
        uid?: string;
        uda: Array<UDA & {
            bitcoinPrice?: number;
            option?: string | number;
        }>;
    }): Promise<IssueUdaResponse>;
    issueAsset(params: {
        title?: string;
        description?: string;
        pubkeyHash?: string;
        uid?: string;
        uda?: UDA & {
            bitcoinPrice?: number;
            option?: string | number;
        };
        asset?: unknown;
    }): Promise<IssueUdaResponse>;
    getInvoice(params: {
        title?: string;
        description?: string;
        pubkeyHash?: string;
        uid?: string;
        uda: unknown;
    }): Promise<GetInvoiceResponse>;
    swapOffer(params: {
        title?: string;
        description?: string;
        pubkeyHash?: string;
        uid?: string;
        offerData: unknown;
    }): Promise<SwapOfferResponse>;
    cancelSwapOffer(params: {
        title?: string;
        description?: string;
        pubkeyHash?: string;
        uid?: string;
        offerCancelData: unknown;
    }): Promise<CancelSwapOfferResponse>;
    swapBid(params: {
        title?: string;
        description?: string;
        pubkeyHash?: string;
        uid?: string;
        bidData: unknown;
        contract: unknown;
    }): Promise<SwapBidResponse>;
    cancelSwapBid(params: {
        title?: string;
        description?: string;
        pubkeyHash?: string;
        uid?: string;
        bidData: unknown;
    }): Promise<CancelSwapBidResponse>;
    passAsset(params: {
        pubkeyHash: string;
        udaData: unknown;
    }): Promise<PassAssetResponse>;
    transfer(params: {
        pubkeyHash: string;
        udaData: unknown;
    }): Promise<TransferResponse>;
    getPubKeyHash(opts?: {
        timeoutMs?: number;
    }): Promise<GetPubKeyHashResponse>;
    isFunded(params: {
        pubkeyHash: string;
    }): Promise<IsFundedResponse>;
    getAddress(params: {
        pubkeyHash: string;
    }): Promise<GetAddressResponse>;
    sendNotification(params: {
        message: string;
        title?: string;
    }): Promise<void>;
    getAssets(): Promise<GetAssetsResponse>;
}

export { type AcceptAssetResponse, BitmaskConnect, type BitmaskConnectOptions, type BulkIssueUdaResponse, type CancelSwapBidResponse, type CancelSwapOfferResponse, type GetAddressResponse, type GetAssetsResponse, type GetInvoiceResponse, type GetPubKeyHashResponse, type GetUsernameResponse, type GetVaultResponse, type IsFundedResponse, type IssueAssetResponse, type IssueUdaResponse, type Network, type PassAssetResponse, type RefreshEvent, type SwapBidResponse, type SwapOfferResponse, type TransferResponse, type UDA, BitmaskConnect as default };
