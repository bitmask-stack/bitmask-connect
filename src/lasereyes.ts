import { BitmaskConnect } from "./index";

export type BitmaskState = {
  connected: boolean;
  address: string | null;
  pubkeyHash: string | null;
  network?: string;
};

export type BitmaskWalletAdapter = {
  id: "BITMASK";
  name: "Bitmask";
  icon: string;
  connect: () => Promise<BitmaskState>;
  disconnect: () => Promise<void>;
  connected: () => boolean;
  address: () => string | null;
  getState: () => BitmaskState;
};

export type CreateBitmaskWalletOptions = {
  timeoutMs?: number;
  targetOrigin?: string;
  onConnect?: (state: BitmaskState) => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
};

const ICON_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
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

export function createBitmaskWallet(
  options: CreateBitmaskWalletOptions = {}
): BitmaskWalletAdapter {
  const bm = new BitmaskConnect({
    timeoutMs: options.timeoutMs,
    targetOrigin: options.targetOrigin,
  });

  let state: BitmaskState = {
    connected: false,
    address: null,
    pubkeyHash: null,
    network: undefined,
  };

  // If user explicitly disconnects, next connect should prompt authorization
  let requirePromptOnNextConnect = false;

  bm.on("refresh", () => {
    options.onRefresh?.();
  });

  async function connect(): Promise<BitmaskState> {
    const ok = await bm.detect(1000);
    if (!ok) throw new Error("Bitmask extension not detected");

    // First try without prompting, unless flagged to prompt
    let pub;
    if (requirePromptOnNextConnect) {
      try {
        await bm.getVault();
      } catch {}
      requirePromptOnNextConnect = false;
      pub = await bm.getPubKeyHash({ timeoutMs: 2000 });
    } else {
      pub = await bm.getPubKeyHash({ timeoutMs: 1500 });
    }
    let pubkeyHash = (pub as any)?.pubkeyHash as string | undefined;
    const network = (pub as any)?.network as string | undefined;

    // If not authorized, prompt once and retry
    if (!pubkeyHash || pubkeyHash === "0" || pubkeyHash === "-1") {
      try {
        await bm.getVault();
      } catch {}
      pub = await bm.getPubKeyHash({ timeoutMs: 2000 });
      pubkeyHash = (pub as any)?.pubkeyHash as string | undefined;
    }

    if (!pubkeyHash || pubkeyHash === "0" || pubkeyHash === "-1") {
      throw new Error(
        "Bitmask: user not authenticated or wallet not available"
      );
    }

    let addr: string | null = null;
    try {
      const a = await bm.getAddress({ pubkeyHash });
      if ((a as any).isLogged === true) {
        addr = (a as any).address ?? null;
      }
    } catch {}

    state = {
      connected: true,
      address: addr,
      pubkeyHash,
      network,
    };
    options.onConnect?.(state);
    return state;
  }

  async function disconnect(): Promise<void> {
    state = {
      connected: false,
      address: null,
      pubkeyHash: null,
      network: undefined,
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
    getState: () => state,
  };
}

export const BITMASK: BitmaskWalletAdapter = createBitmaskWallet();

export type BitmaskButton = {
  id: "BITMASK";
  label: string;
  icon: string;
  onClick: () => Promise<void>;
};

export function getBitmaskButton(
  adapter: BitmaskWalletAdapter = BITMASK
): BitmaskButton {
  return {
    id: adapter.id,
    label: "Bitmask",
    icon: adapter.icon,
    onClick: () => adapter.connect().then(() => undefined),
  };
}
