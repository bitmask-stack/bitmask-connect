import BitmaskConnect from './index.cjs';
export { BitmaskConnectOptions } from './index.cjs';

type BitmaskState = {
    connected: boolean;
    address: string | null;
    pubkeyHash: string | null;
    network?: string;
};
type BitmaskWalletAdapter = {
    id: "BITMASK";
    name: "Bitmask";
    icon: string;
    connect: () => Promise<BitmaskState>;
    disconnect: () => Promise<void>;
    connected: () => boolean;
    address: () => string | null;
    getState: () => BitmaskState;
    bitmask: BitmaskConnect;
};
type CreateBitmaskWalletOptions = {
    timeoutMs?: number;
    targetOrigin?: string;
    onConnect?: (state: BitmaskState) => void;
    onDisconnect?: () => void;
    onRefresh?: () => void;
};
declare function createBitmaskWallet(options?: CreateBitmaskWalletOptions): BitmaskWalletAdapter;
declare const BITMASK: BitmaskWalletAdapter;
type BitmaskButton = {
    id: "BITMASK";
    label: string;
    icon: string;
    onClick: () => Promise<void>;
};
declare function getBitmaskButton(adapter?: BitmaskWalletAdapter): BitmaskButton;

export { BITMASK, type BitmaskButton, BitmaskConnect, type BitmaskState, type BitmaskWalletAdapter, type CreateBitmaskWalletOptions, createBitmaskWallet, getBitmaskButton };
