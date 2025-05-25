# BitMask Connect SDK

A comprehensive TypeScript/JavaScript SDK for integrating BitMask wallet functionality into your dApps. BitMask Connect provides easy-to-use methods for Bitcoin, RGB assets, and EVM chain interactions.

## Features

- 🔐 **Wallet Connection**: Connect to BitMask browser extension
- 🪙 **Bitcoin Support**: Native Bitcoin operations
- 🎨 **RGB Protocol**: Issue and manage RGB21 assets (NFTs)
- 🔄 **Asset Swaps**: Create and manage swap offers/bids
- ⚡ **EVM Compatibility**: Full Rootstock/EVM chain support
- 🌈 **RainbowKit Integration**: Easy integration with RainbowKit

## Installation

```bash
npm install bitmask-connect
# or
yarn add bitmask-connect
```

## Quick Start

```typescript
import { bitmask } from 'bitmask-connect';
// or
import BitMaskSDK from 'bitmask-connect';

// Using the singleton instance
const walletId = await bitmask.getVault();

// Or create your own instance
const sdk = new BitMaskSDK();
const walletId = await sdk.getVault();
```

## Core Methods

### Wallet Connection

#### Connect to BitMask Wallet
```typescript
try {
  // Connect to wallet - returns wallet ID (pubKeyHash)
  const walletId = await bitmask.getVault(
    'Connect Wallet',           // Optional: Custom title
    'Connect to use our dApp'   // Optional: Custom description
  );
  
  if (walletId === '0') {
    console.log('User rejected connection');
  } else if (walletId === '-1') {
    console.log('No BitMask wallet found');
  } else {
    console.log('Connected! Wallet ID:', walletId);
  }
} catch (error) {
  console.error('Connection failed:', error);
}
```

#### Get Username
```typescript
try {
  const username = await bitmask.getUsername();
  console.log('BitMask username:', username);
} catch (error) {
  console.error('Failed to get username:', error);
}
```

#### Get Wallet Info
```typescript
// Get public key hash and network
const { pubkeyHash, network } = await bitmask.getPubKeyHash();
console.log('Wallet:', pubkeyHash, 'Network:', network);

// Check if wallet is funded
const isFunded = await bitmask.isFunded();
console.log('Wallet funded:', isFunded);

// Get Bitcoin address
const address = await bitmask.getAddress();
console.log('Bitcoin address:', address);
```

### RGB Assets (NFTs)

#### Issue/Mint RGB21 Asset
```typescript
try {
  const result = await bitmask.issueUDA({
    name: 'My Awesome NFT',
    description: 'This is a unique digital asset on RGB',
    ticker: 'AWESOME',  // Optional: defaults to first 8 chars of name
    image: 'https://example.com/image.png',  // Optional
    meta: {  // Optional: additional metadata
      artist: 'John Doe',
      year: 2024
    },
    bitcoinPrice: 1000,  // Price in satoshis (optional)
    option: 'mint'  // 'mint', 'transfer', or 'Unlisted'
  });
  
  console.log('Asset issued:', result.issueResponse);
  if (result.swapResponse) {
    console.log('Swap created:', result.swapResponse);
  }
} catch (error) {
  console.error('Failed to issue asset:', error);
}
```

### Asset Trading

#### Create Swap Offer
```typescript
try {
  const swapOffer = await bitmask.createSwapOffer({
    contractId: 'rgb:2WBfJ2E-HywLVbPZH-uXMFjFwSf-Zy8MmkPDZG-wFMZGvQCLW-KNmDvBC',
    contractAmount: '1',  // Amount of assets to offer
    bitcoinPrice: 5000    // Price in satoshis
  });
  
  console.log('Swap offer created:', swapOffer);
} catch (error) {
  console.error('Failed to create swap offer:', error);
}
```

#### Create Swap Bid
```typescript
try {
  const swapBid = await bitmask.createSwapBid({
    bundleId: 'bundle123',
    offerId: 'offer456',
    bitcoinPrice: 5000  // Bid amount in satoshis
  });
  
  console.log('Bid placed:', swapBid);
} catch (error) {
  console.error('Failed to place bid:', error);
}
```

### EVM/Rootstock Operations

#### Request EVM Accounts
```typescript
try {
  // Request account access (shows popup)
  const accounts = await bitmask.evmRequestAccounts();
  console.log('Connected accounts:', accounts);
  
  // Get accounts without popup (if already connected)
  const currentAccounts = await bitmask.evmGetAccounts();
  console.log('Current accounts:', currentAccounts);
} catch (error) {
  console.error('Failed to get accounts:', error);
}
```

#### Send Transaction
```typescript
try {
  const txHash = await bitmask.evmSendTransaction({
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
    to: '0x5aAeb6053F3e94c9B0a09e7f5e5e34f12Cc5F456',
    value: '0x9184e72a000',  // 10000000000000 wei
    data: '0x',  // Optional: contract data
    gas: '0x5208',  // Optional: gas limit
    gasPrice: '0x3b9aca00'  // Optional: gas price
  });
  
  console.log('Transaction sent:', txHash);
} catch (error) {
  console.error('Transaction failed:', error);
}
```

#### Sign Message
```typescript
try {
  const signature = await bitmask.personalSign(
    'Hello BitMask!',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123'
  );
  
  console.log('Message signed:', signature);
} catch (error) {
  console.error('Failed to sign message:', error);
}
```

#### Switch Chain
```typescript
try {
  // Switch to Rootstock Mainnet
  await bitmask.walletSwitchEvmChain('0x1e');  // Chain ID 30
  console.log('Switched to Rootstock Mainnet');
} catch (error) {
  console.error('Failed to switch chain:', error);
}
```

#### Add Custom Chain
```typescript
try {
  await bitmask.walletAddEvmChain({
    chainId: '0x1f',  // 31 in hex
    chainName: 'Rootstock Testnet',
    nativeCurrency: {
      name: 'Test RBTC',
      symbol: 'tRBTC',
      decimals: 18
    },
    rpcUrls: ['https://public-node.testnet.rsk.co'],
    blockExplorerUrls: ['https://explorer.testnet.rsk.co']
  });
  
  console.log('Chain added successfully');
} catch (error) {
  console.error('Failed to add chain:', error);
}
```

## RainbowKit Integration

BitMask Connect provides seamless integration with RainbowKit for a beautiful wallet connection experience.

### Basic Setup

```typescript
import { bitmask } from 'bitmask-connect';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { rootstock, rootstockTestnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

// Configure chains
const { chains, publicClient } = configureChains(
  [rootstock, rootstockTestnet],
  [publicProvider()]
);

// Create BitMask connector
const bitmaskConnector = bitmask.createRainbowKitConnector({
  name: 'BitMask Wallet',  // Optional: custom name
  iconUrl: 'https://example.com/bitmask-icon.png',  // Optional: custom icon
  iconBackground: '#F7931A'  // Optional: icon background color
});

// Configure connectors
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      bitmaskConnector,
      // ... other wallets
    ],
  },
]);

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});
```

### Complete RainbowKit Example

```tsx
import React from 'react';
import { bitmask } from 'bitmask-connect';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
  connectorsForWallets,
  Wallet
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { rootstock, rootstockTestnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

// Configure chains
const { chains, publicClient } = configureChains(
  [rootstock, rootstockTestnet],
  [publicProvider()]
);

// Get default wallets
const { wallets } = getDefaultWallets({
  appName: 'My dApp',
  projectId: 'YOUR_PROJECT_ID',
  chains
});

// Create BitMask wallet configuration
const bitmaskWallet: Wallet = bitmask.createRainbowKitConnector({
  name: 'BitMask',
  iconUrl: 'https://yourdomain.com/bitmask-icon.svg',
  iconBackground: '#F7931A'
});

// Combine wallets
const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: 'Bitcoin Wallets',
    wallets: [bitmaskWallet],
  },
]);

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

// Your App component
function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        {/* Your app content */}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
```

### Custom Connect Button

```tsx
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal} type="button">
                    Connect BitMask
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type="button">
                    Wrong network
                  </button>
                );
              }

              return (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={openChainModal}
                    style={{ display: 'flex', alignItems: 'center' }}
                    type="button"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button onClick={openAccountModal} type="button">
                    {account.displayName}
                    {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ''}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
```

## Utility Methods

### Send Notification
```typescript
// Send a browser notification
bitmask.sendNotification(
  'Transaction Complete',
  'Your NFT has been successfully minted!'
);
```

### Get Chain ID
```typescript
const chainId = await bitmask.evmChainId();
console.log('Current chain ID:', chainId);
```

## Error Handling

All methods return promises and should be wrapped in try-catch blocks:

```typescript
try {
  const result = await bitmask.someMethod();
  // Handle success
} catch (error) {
  if (error.error === 'User rejected') {
    // Handle user rejection
  } else if (error.error === 'Not connected') {
    // Handle not connected
  } else {
    // Handle other errors
    console.error('Error:', error.errorMessage || error.error);
  }
}
```

## TypeScript Support

BitMask Connect is written in TypeScript and provides full type definitions:

```typescript
import { BitMaskSDK, BitMaskResponse, BitMaskError } from 'bitmask-connect';

// All methods are fully typed
const sdk = new BitMaskSDK();

// TypeScript will provide intellisense and type checking
const response: BitMaskResponse = await sdk.getVault();
```

## Browser Compatibility

BitMask Connect requires:
- BitMask browser extension installed
- Modern browser with ES2017 support
- Window.postMessage API support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

- [BitMask Documentation](https://bitmask.app/docs)
- [GitHub Issues](https://github.com/diba-io/bitmask-connect/issues)
- [Discord Community](https://discord.gg/bitmask)
