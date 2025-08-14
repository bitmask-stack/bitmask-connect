type AnyFn = (...args: any[]) => void;

type Pending = {
  resolve: (v: any) => void;
  reject: (e: any) => void;
  timer: ReturnType<typeof setTimeout>;
};

const DEFAULT_TIMEOUT = 30_000;

function genId(prefix = "BC"): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rnd}`;
}

export type BitmaskConnectOptions = {
  timeoutMs?: number;
  targetOrigin?: string;
};

export type Network = string;

// Prefer importing types from bitmask-core if available in consumer env
// Using type-only imports to avoid runtime dependency here
// Optional: If your app has bitmask-core types, you can augment this via declaration merging.
// Here we keep a minimal placeholder to avoid coupling the SDK's build to a specific core version.
export type UDA = unknown;

export type GetVaultResponse = {
  returnid: string;
  wallet_id: string; // "-1" not logged, "0" unauth, else actual
  errorTitle?: string;
  errorMessage?: string;
};

export type GetUsernameResponse = {
  returnid: string;
  txid: string;
  username?: string;
};

export type IssueUdaResponse = {
  returnid: string;
  txid: string;
  issueResponse?: unknown;
  swapResponse?: unknown;
  network?: Network;
  errorTitle?: string;
  errorMessage?: string;
};

export type BulkIssueUdaResponse = IssueUdaResponse;

export type GetInvoiceResponse = {
  returnid: string;
  txid: string;
  invoiceResponse?: unknown;
};

export type AcceptAssetResponse = {
  returnid: string;
  txid: string;
  acceptResponse?: unknown;
};

export type SwapOfferResponse = {
  returnid: string;
  txid: string;
  swapOfferResponse?: unknown;
  checkSwapResponse?: unknown;
};

export type CancelSwapOfferResponse = {
  returnid: string;
  txid: string;
  cancelSwapResponse?: unknown;
};

export type SwapBidResponse = {
  returnid: string;
  transaction?: unknown;
  swapResponse?: unknown;
  checkSwapResponse?: unknown;
  network?: Network;
  errorTitle?: string;
  errorMessage?: string;
};

export type CancelSwapBidResponse = {
  returnid: string;
  txid: string;
  cancelSwapResponse?: unknown;
};

export type GetAssetsResponse = {
  returnid: string | null; // null when missing id on request
  assets?: unknown[];
  error?: string;
  test?: unknown;
};

export type PassAssetResponse = {
  returnid: string;
  txid: string;
  vout: number;
};

export type TransferResponse = {
  returnid: string;
  txid: string;
  vout: number;
  consignment: string;
  id?: string; // content-script posts both in success path
};

export type GetPubKeyHashResponse =
  | { returnid: string; pubkeyHash: string; network?: Network }
  | { returnid: string; pubkeyHash: "0" | "-1" };

export type IsFundedResponse =
  | { returnid: string; isLogged: false }
  | { returnid: string; isLogged: true; isFunded: boolean };

export type GetAddressResponse =
  | { returnid: string; isLogged: false }
  | { returnid: string; isLogged: true; address?: string };

export type RefreshEvent = { refresh: true };

const CALLS = {
  GetVault: "get_vault",
  GetUsername: "get_username",
  IssueUDA: "issue_uda",
  BulkIssueUDA: "bulk_issue_uda",
  SwapOffer: "swap_offer",
  CancelSwapOffer: "cancel_swap_offer",
  SwapBid: "swap_bid",
  CancelSwapBid: "cancel_swap_bid",
  GetInvoice: "get_invoice",
  PassAsset: "pass_asset",
  TransferWeird: "`transfer`", // matches content-script
  GetPubKeyHash: "get_pubkeyhash",
  IsFunded: "is_funded",
  GetAddress: "get_address",
  SendNotification: "send_notification",
  GetAssets: "get_assets",
} as const;

type PendingEntry = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timer: ReturnType<typeof setTimeout>;
};

type EventName = "refresh";

export class BitmaskConnect {
  private pending = new Map<string, PendingEntry>();
  private listeners = new Map<EventName, Set<AnyFn>>();
  private timeoutMs: number;
  private targetOrigin: string;
  private boundOnMessage: (e: MessageEvent) => void;

  constructor(opts: BitmaskConnectOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
    this.targetOrigin = opts.targetOrigin ?? "*";
    this.boundOnMessage = this.onWindowMessage.bind(this);

    if (typeof window === "undefined") {
      throw new Error("BitmaskConnect must be used in a browser context");
    }
    window.addEventListener("message", this.boundOnMessage);
  }

  dispose() {
    window.removeEventListener("message", this.boundOnMessage);
    this.pending.forEach((p) => clearTimeout(p.timer));
    this.pending.clear();
    this.listeners.clear();
  }

  on(event: EventName, handler: AnyFn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: EventName, handler: AnyFn) {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: EventName, ...args: any[]) {
    this.listeners.get(event)?.forEach((h) => h(...args));
  }

  private onWindowMessage(e: MessageEvent) {
    if (e.source !== window) return;
    const data: any = e.data;

    if (data && data.refresh === true) {
      this.emit("refresh");
      return;
    }

    const id = data?.returnid;
    if (!id) return;
    const pending = this.pending.get(id);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(id);
    pending.resolve(data);
  }

  private send<TRes>(payload: Record<string, any>, timeoutMs?: number) {
    const id = genId();
    const msg = { ...payload, id, dateId: id };

    return new Promise<TRes>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new Error(
            `BitmaskConnect: timeout waiting for response to ${payload.call}`
          )
        );
      }, timeoutMs ?? this.timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      window.postMessage(msg, this.targetOrigin);
    });
  }

  async detect(timeoutMs = 800): Promise<boolean> {
    try {
      const res = await this.getPubKeyHash({ timeoutMs });
      return Boolean((res as any).pubkeyHash);
    } catch {
      return false;
    }
  }

  getVault(
    params: {
      title?: string;
      description?: string;
      pubkeyHash?: string;
      uid?: string;
    } = {}
  ) {
    return this.send<GetVaultResponse>({
      call: CALLS.GetVault,
      ...params,
    });
  }

  getUsername(
    params: {
      title?: string;
      description?: string;
      pubkeyHash?: string;
      uid?: string;
    } = {}
  ) {
    return this.send<GetUsernameResponse>({
      call: CALLS.GetUsername,
      ...params,
    });
  }

  issueUDA(params: {
    title?: string;
    description?: string;
    pubkeyHash?: string;
    uid?: string;
    uda: UDA & { bitcoinPrice?: number; option?: string | number };
  }) {
    return this.send<IssueUdaResponse>({
      call: CALLS.IssueUDA,
      ...params,
    });
  }

  bulkIssueUDA(params: {
    title?: string;
    description?: string;
    pubkeyHash?: string;
    uid?: string;
    uda: Array<UDA & { bitcoinPrice?: number; option?: string | number }>;
  }) {
    return this.send<BulkIssueUdaResponse>({
      call: CALLS.BulkIssueUDA,
      ...params,
    });
  }

  getInvoice(params: {
    title?: string;
    description?: string;
    pubkeyHash?: string;
    uid?: string;
    uda: unknown;
  }) {
    return this.send<GetInvoiceResponse>({
      call: CALLS.GetInvoice,
      ...params,
    });
  }

  swapOffer(params: {
    title?: string;
    description?: string;
    pubkeyHash?: string;
    uid?: string;
    offerData: unknown;
  }) {
    return this.send<SwapOfferResponse>({
      call: CALLS.SwapOffer,
      ...params,
    });
  }

  cancelSwapOffer(params: {
    title?: string;
    description?: string;
    pubkeyHash?: string;
    uid?: string;
    offerCancelData: unknown;
  }) {
    return this.send<CancelSwapOfferResponse>({
      call: CALLS.CancelSwapOffer,
      ...params,
    });
  }

  swapBid(params: {
    title?: string;
    description?: string;
    pubkeyHash?: string;
    uid?: string;
    bidData: unknown;
    contract: unknown;
  }) {
    return this.send<SwapBidResponse>({
      call: CALLS.SwapBid,
      ...params,
    });
  }

  cancelSwapBid(params: {
    title?: string;
    description?: string;
    pubkeyHash?: string;
    uid?: string;
    bidData: unknown;
  }) {
    return this.send<CancelSwapBidResponse>({
      call: CALLS.CancelSwapBid,
      ...params,
    });
  }

  passAsset(params: { pubkeyHash: string; udaData: unknown }) {
    const payload = { ...params, udaData: JSON.stringify(params.udaData) };
    return this.send<PassAssetResponse>({
      call: CALLS.PassAsset,
      ...payload,
    });
  }

  transfer(params: { pubkeyHash: string; udaData: unknown }) {
    const payload = { ...params, udaData: JSON.stringify(params.udaData) };
    return this.send<TransferResponse>({
      call: CALLS.TransferWeird,
      ...payload,
    });
  }

  getPubKeyHash(opts?: { timeoutMs?: number }) {
    return this.send<GetPubKeyHashResponse>(
      { call: CALLS.GetPubKeyHash },
      opts?.timeoutMs
    );
  }

  isFunded(params: { pubkeyHash: string }) {
    return this.send<IsFundedResponse>({
      call: CALLS.IsFunded,
      ...params,
    });
  }

  getAddress(params: { pubkeyHash: string }) {
    return this.send<GetAddressResponse>({
      call: CALLS.GetAddress,
      ...params,
    });
  }

  sendNotification(params: { message: string; title?: string }) {
    window.postMessage(
      { call: CALLS.SendNotification, ...params },
      this.targetOrigin
    );
    return Promise.resolve();
  }

  getAssets() {
    return this.send<GetAssetsResponse>({ call: CALLS.GetAssets });
  }
}

export default BitmaskConnect;
