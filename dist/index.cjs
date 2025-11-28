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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BitmaskConnect: () => BitmaskConnect,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var DEFAULT_TIMEOUT = 3e4;
function genId(prefix = "BC") {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rnd}`;
}
var CALLS = {
  GetVault: "get_vault",
  GetUsername: "get_username",
  GetUserData: "get_user_data",
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
  SendSats: "send_sats",
  MintPerSats: "mint_per_sats",
  GetAssets: "get_assets",
  IssueAsset: "issue_asset"
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
  getUserData(params = {}) {
    return this.send({
      call: CALLS.GetUserData,
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
  issueAsset(params) {
    return this.send({
      call: CALLS.IssueAsset,
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
  sendSats(params) {
    return this.send({
      call: CALLS.SendSats,
      ...params,
      paymentData: {
        recipientAddress: params.recipientAddress,
        amount: params.amount,
        feeRate: params.feeRate
      }
    });
  }
  mintPerSats(params) {
    return this.send({
      call: CALLS.MintPerSats,
      ...params
    });
  }
  getAssets() {
    return this.send({ call: CALLS.GetAssets });
  }
};
var index_default = BitmaskConnect;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BitmaskConnect
});
