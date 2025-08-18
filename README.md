## bitmask-connect

A tiny, typed web SDK that lets dApps talk to the Bitmask browser extension through its content-script bridge.

### What this gives you

- **1:1 API** with the extension's `content-script.js` calls
- **Promise-based** responses with per-call timeouts
- **ID routing** that matches `returnid` in replies
- **Compatibility** with current quirks (uses both `id` and `dateId`, and the odd `` `transfer` `` call name)

### Install

```bash
yarn add bitmask-connect
# or
npm i bitmask-connect
```

### Quick start

```ts
import { BitmaskConnect } from "bitmask-connect";

const bm = new BitmaskConnect();

// Optional: check the bridge quickly
const available = await bm.detect();
if (!available) {
  console.warn("Bitmask extension not detected");
}

// Get pubkeyHash / network
const pub = await bm.getPubKeyHash();

// Fetch assets
const assets = await bm.getAssets();

// Issue UDA
await bm.issueUDA({
  pubkeyHash: (pub as any).pubkeyHash,
  uda: { name: "My Asset" } as any,
});
```

### API

All methods return a `Promise<...>` that resolves to the raw payload posted by the content-script for the matching `returnid`.

Most methods accept optional `{ title?, description?, pubkeyHash?, uid? }` metadata where applicable.

```ts
const bm = new BitmaskConnect({ timeoutMs?: number, targetOrigin?: string });

// Session / identity
bm.getVault(params?) => Promise<{ wallet_id: string, returnid: string, errorTitle?, errorMessage? }>
bm.getPubKeyHash({ timeoutMs? }?) => Promise<{ pubkeyHash: string | "0" | "-1", returnid: string, network? }>
bm.getUsername(params?) => Promise<{ txid: string, username?, returnid: string }>

// Assets
bm.getAssets() => Promise<{ assets?: any[], error?: string, returnid: string | null }>
bm.getInvoice({ uda, ... }) => Promise<{ txid: string, invoiceResponse?, returnid: string }>
bm.passAsset({ pubkeyHash, udaData }) => Promise<{ txid: string, vout: number, returnid: string }>
bm.transfer({ pubkeyHash, udaData }) => Promise<{ txid: string, vout: number, consignment: string, returnid: string }>

// UDA issuing
bm.issueUDA({ uda, ... }) => Promise<{ txid: string, issueResponse?, swapResponse?, network?, errorTitle?, errorMessage?, returnid: string }>
bm.bulkIssueUDA({ uda: UDA[], ... }) => Promise<same as issueUDA>

// Swaps
bm.swapOffer({ offerData, ... }) => Promise<{ txid: string, swapOfferResponse?, checkSwapResponse?, returnid: string }>
bm.cancelSwapOffer({ offerCancelData, ... }) => Promise<{ txid: string, cancelSwapResponse?, returnid: string }>
bm.swapBid({ bidData, contract, ... }) => Promise<{ transaction?, swapResponse?, checkSwapResponse?, network?, errorTitle?, errorMessage?, returnid: string }>
bm.cancelSwapBid({ bidData, ... }) => Promise<{ txid: string, cancelSwapResponse?, returnid: string }>

// Wallet state
bm.isFunded({ pubkeyHash }) => Promise<{ isLogged: false, returnid } | { isLogged: true, isFunded: boolean, returnid }>
bm.getAddress({ pubkeyHash }) => Promise<{ isLogged: false, returnid } | { isLogged: true, address?: string, returnid }>

// UX
bm.sendNotification({ title?, message }) => Promise<void>

// Lifecycle
bm.detect(timeoutMs = 800) => Promise<boolean>
bm.dispose(): void
```

### Behavior details

- The SDK posts messages on `window` and listens for replies that include a matching `returnid`.
- Every request includes both `id` and `dateId` (same value) to be compatible with the current content-script.
- `getAssets` internally uses the extension's port bridge; the SDK just sends the request with an `id` and resolves on the first matching reply.
- The `transfer` call name is literally `` `transfer` `` to match the current content-script condition.
- `passAsset` and `transfer` stringify `udaData` as expected by the content-script.
- `sendNotification` is fire-and-forget (no response expected).
- Default timeout is 30s. You can override per instance or per call (only for `getPubKeyHash` at the moment).

### TypeScript

If you have `bitmask-core` in your project, the SDK uses type-only imports to annotate inputs like `UDA`. Otherwise, you can treat those as `any` or add your own ambient types.

```ts
import type { UDA } from "bitmask-core";

await bm.issueUDA({
  uda: {
    /* your UDA fields */
  } as UDA,
});
```

### Security note

The current content-script accepts messages from any page origin. Consider tightening checks in the extension in future versions. DApps should also validate response shapes and handle errors/timeouts gracefully.

### Build & local development

```bash
yarn
yarn build
```

This builds ESM, CJS, and type declarations in `dist/`.

### LaserEyes integration

Use the adapter in `bitmask-connect/lasereyes` to add Bitmask as a wallet in LaserEyes. See [LaserEyes docs](https://www.lasereyes.build/docs).

- Import the adapter:

```ts
import { BITMASK, createBitmaskWallet } from "bitmask-connect/lasereyes";
```

- With React (lasereyes-react):

```tsx
import { LaserEyesProvider } from "@omnisat/lasereyes-react";
import { BITMASK } from "bitmask-connect/lasereyes";

export function App() {
  return (
    <LaserEyesProvider
      config={{
        network: "mainnet",
        wallets: [BITMASK],
      }}
    >
      {/* your UI */}
    </LaserEyesProvider>
  );
}
```

- Combine with other wallets, or show only Bitmask:

```tsx
import { LaserEyesProvider } from "@omnisat/lasereyes-react";
import { BITMASK, createBitmaskWallet } from "bitmask-connect/lasereyes";

const customBitmask = createBitmaskWallet({
  timeoutMs: 2000,
  onConnect: (s) => console.log("Bitmask connected", s),
});

<LaserEyesProvider
  config={{
    network: "mainnet",
    wallets: [customBitmask],
  }}
>
  {/* render only Bitmask button in your UI */}
</LaserEyesProvider>;
```

- Render a default Bitmask button (no React dependency):

```ts
import { getBitmaskButton } from "bitmask-connect/lasereyes";

const btn = getBitmaskButton();
document.getElementById("bitmask-btn")!.onclick = () => btn.onClick();
```

Adapter API:

- `BITMASK` ready-made adapter
- `createBitmaskWallet(options?)` returns a new adapter
- `getBitmaskButton(adapter?)` returns `{ id, label, icon, onClick }`

The adapter exposes:

- `connect()` → resolves `{ connected, address, pubkeyHash, network }`
- `disconnect()`
- `connected()`, `address()`, `getState()`

### License

MIT
