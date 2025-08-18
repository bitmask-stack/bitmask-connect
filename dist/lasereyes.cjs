"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lasereyes.ts
var lasereyes_exports = {};
__export(lasereyes_exports, {
  BITMASK: () => BITMASK,
  createBitmaskWallet: () => createBitmaskWallet,
  getBitmaskButton: () => getBitmaskButton
});
module.exports = __toCommonJS(lasereyes_exports);

// src/index.ts
var DEFAULT_TIMEOUT = 3e4;
function genId(prefix = "BC") {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rnd}`;
}
var CALLS = {
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
  TransferWeird: "`transfer`",
  // matches content-script
  GetPubKeyHash: "get_pubkeyhash",
  IsFunded: "is_funded",
  GetAddress: "get_address",
  SendNotification: "send_notification",
  GetAssets: "get_assets"
};
var BitmaskConnect = class {
  constructor(opts = {}) {
    this.pending = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Map();
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
  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, /* @__PURE__ */ new Set());
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }
  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
  }
  emit(event, ...args) {
    this.listeners.get(event)?.forEach((h) => h(...args));
  }
  onWindowMessage(e) {
    if (e.source !== window) return;
    const data = e.data;
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
  send(payload, timeoutMs) {
    const id = genId();
    const msg = { ...payload, id, dateId: id };
    return new Promise((resolve, reject) => {
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
  async detect(timeoutMs = 800) {
    try {
      const res = await this.getPubKeyHash({ timeoutMs });
      const ph = res?.pubkeyHash;
      return Boolean(ph && ph !== "0" && ph !== "-1");
    } catch {
      return false;
    }
  }
  getVault(params = {}) {
    return this.send({
      call: CALLS.GetVault,
      ...params
    });
  }
  getUsername(params = {}) {
    return this.send({
      call: CALLS.GetUsername,
      ...params
    });
  }
  issueUDA(params) {
    return this.send({
      call: CALLS.IssueUDA,
      ...params
    });
  }
  bulkIssueUDA(params) {
    return this.send({
      call: CALLS.BulkIssueUDA,
      ...params
    });
  }
  getInvoice(params) {
    return this.send({
      call: CALLS.GetInvoice,
      ...params
    });
  }
  swapOffer(params) {
    return this.send({
      call: CALLS.SwapOffer,
      ...params
    });
  }
  cancelSwapOffer(params) {
    return this.send({
      call: CALLS.CancelSwapOffer,
      ...params
    });
  }
  swapBid(params) {
    return this.send({
      call: CALLS.SwapBid,
      ...params
    });
  }
  cancelSwapBid(params) {
    return this.send({
      call: CALLS.CancelSwapBid,
      ...params
    });
  }
  passAsset(params) {
    const payload = { ...params, udaData: JSON.stringify(params.udaData) };
    return this.send({
      call: CALLS.PassAsset,
      ...payload
    });
  }
  transfer(params) {
    const payload = { ...params, udaData: JSON.stringify(params.udaData) };
    return this.send({
      call: CALLS.TransferWeird,
      ...payload
    });
  }
  getPubKeyHash(opts) {
    return this.send(
      { call: CALLS.GetPubKeyHash },
      opts?.timeoutMs
    );
  }
  isFunded(params) {
    return this.send({
      call: CALLS.IsFunded,
      ...params
    });
  }
  getAddress(params) {
    return this.send({
      call: CALLS.GetAddress,
      ...params
    });
  }
  sendNotification(params) {
    window.postMessage(
      { call: CALLS.SendNotification, ...params },
      this.targetOrigin
    );
    return Promise.resolve();
  }
  getAssets() {
    return this.send({ call: CALLS.GetAssets });
  }
};

// src/lasereyes.ts
var ICON_DATA_URL = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6c5ce7"/>
          <stop offset="100%" stop-color="#a29bfe"/>
        </linearGradient>
      </defs>
      <rect rx="8" ry="8" width="32" height="32" fill="url(#g)"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Inter,Arial" font-size="14" fill="white">BM</text>
    </svg>`
);
function createBitmaskWallet(options = {}) {
  const bm = new BitmaskConnect({
    timeoutMs: options.timeoutMs,
    targetOrigin: options.targetOrigin
  });
  let state = {
    connected: false,
    address: null,
    pubkeyHash: null,
    network: void 0
  };
  let requirePromptOnNextConnect = false;
  bm.on("refresh", () => {
    options.onRefresh?.();
  });
  async function connect() {
    const ok = await bm.detect(1e3);
    if (!ok) throw new Error("Bitmask extension not detected");
    let pub;
    if (requirePromptOnNextConnect) {
      try {
        await bm.getVault();
      } catch {
      }
      requirePromptOnNextConnect = false;
      pub = await bm.getPubKeyHash({ timeoutMs: 2e3 });
    } else {
      pub = await bm.getPubKeyHash({ timeoutMs: 1500 });
    }
    let pubkeyHash = pub?.pubkeyHash;
    const network = pub?.network;
    if (!pubkeyHash || pubkeyHash === "0" || pubkeyHash === "-1") {
      try {
        await bm.getVault();
      } catch {
      }
      pub = await bm.getPubKeyHash({ timeoutMs: 2e3 });
      pubkeyHash = pub?.pubkeyHash;
    }
    if (!pubkeyHash || pubkeyHash === "0" || pubkeyHash === "-1") {
      throw new Error(
        "Bitmask: user not authenticated or wallet not available"
      );
    }
    let addr = null;
    try {
      const a = await bm.getAddress({ pubkeyHash });
      if (a.isLogged === true) {
        addr = a.address ?? null;
      }
    } catch {
    }
    state = {
      connected: true,
      address: addr,
      pubkeyHash,
      network
    };
    options.onConnect?.(state);
    return state;
  }
  async function disconnect() {
    state = {
      connected: false,
      address: null,
      pubkeyHash: null,
      network: void 0
    };
    options.onDisconnect?.();
    requirePromptOnNextConnect = true;
  }
  return {
    id: "BITMASK",
    name: "Bitmask",
    icon: ICON_DATA_URL,
    connect,
    disconnect,
    connected: () => state.connected,
    address: () => state.address,
    getState: () => state
  };
}
var BITMASK = createBitmaskWallet();
function getBitmaskButton(adapter = BITMASK) {
  return {
    id: adapter.id,
    label: "Bitmask",
    icon: adapter.icon,
    onClick: () => adapter.connect().then(() => void 0)
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BITMASK,
  createBitmaskWallet,
  getBitmaskButton
});
