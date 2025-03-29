<img src="public/assets/superpay-logo.svg" alt="SuperPay Logo" width="200"/>

# System Diagrams


This document contains sequence diagrams for all major user flows in the SuperPay application.

## Authentication & User Management

### User Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant Clerk as Clerk Auth
    participant SuperPay as SuperPay App
    participant DB as Database

    Note over User,Clerk: User signs up/logs in through Clerk's UI
    Clerk->>Clerk: Handle authentication
    Clerk-->>User: Auth session established
    Note over User,SuperPay: User makes API request
    SuperPay->>Clerk: Middleware validates auth token
    alt Valid token
        Clerk-->>SuperPay: Provides userId
        SuperPay->>DB: findOrCreate user doc
        SuperPay-->>User: 200 OK (with user data)
    else Invalid token
        SuperPay-->>User: 401 Unauthorized
    end
```

## Wallet Management

### Wallet Initialization
```mermaid
sequenceDiagram
    participant User
    participant Clerk as Clerk Auth
    participant SuperPay as SuperPay App
    participant DB as Database
    participant CoinbaseSDK as Coinbase SDK

    User->>SuperPay: [GET] /api/wallet
    SuperPay->>Clerk: Middleware provides userId
    alt Auth success
        SuperPay->>DB: findOrCreate user doc
        alt No wallet exists
            SuperPay->>CoinbaseSDK: Wallet.create()
            CoinbaseSDK->>CoinbaseSDK: Generate {seed, walletId, address}
            CoinbaseSDK-->>SuperPay: return wallet data
            SuperPay->>SuperPay: encrypt seed with SuperPay's key
            SuperPay->>DB: user.wallet = { id, address, seed: encryptedSeed }
        end
        SuperPay-->>User: 200 OK (user data with wallet info)
    else Auth failure
        SuperPay-->>User: 401 Unauthorized
    end
```

### Asset Transfer
```mermaid
sequenceDiagram
    participant User
    participant Clerk as Clerk Auth
    participant SuperPay as SuperPay App
    participant DB as Database
    participant CoinbaseSDK as Coinbase SDK

    User->>SuperPay: [POST] /api/wallet/transfer {recipient, asset, amount}
    SuperPay->>Clerk: Middleware provides userId
    alt Auth success
        SuperPay->>DB: find user + user.wallet doc
        SuperPay->>SuperPay: decrypt seed from user.wallet.seed
        SuperPay->>CoinbaseSDK: Wallet.import({seed, walletId})
        CoinbaseSDK->>CoinbaseSDK: create local Wallet instance
        SuperPay->>CoinbaseSDK: wallet.createTransfer({recipient, asset, amount})
        CoinbaseSDK->>CoinbaseSDK: broadcast transfer on chain
        CoinbaseSDK-->>SuperPay: transfer success/failure
        SuperPay-->>User: 200 OK (transfer details)
    else Auth failure
        SuperPay-->>User: 401 Unauthorized
    end
```

### Asset Trading
```mermaid
sequenceDiagram
    participant User
    participant Clerk as Clerk Auth
    participant SuperPay as SuperPay App
    participant DB as Database
    participant CoinbaseSDK as Coinbase SDK

    User->>SuperPay: [POST] /api/wallet/trade { fromAsset, toAsset, amount }
    SuperPay->>Clerk: Middleware provides userId
    alt Auth success
        SuperPay->>DB: find user + user.wallet
        SuperPay->>SuperPay: decrypt seed from user.wallet.seed
        SuperPay->>CoinbaseSDK: Wallet.import({seed, walletId})
        CoinbaseSDK->>CoinbaseSDK: local wallet from seed
        SuperPay->>CoinbaseSDK: wallet.createTrade({ fromAsset, toAsset, amount })
        CoinbaseSDK->>CoinbaseSDK: do on-chain swap
        CoinbaseSDK-->>SuperPay: return trade result (tx hash, status)
        SuperPay-->>User: 200 OK
    else Auth failure
        SuperPay-->>User: 401 Unauthorized
    end
```

## Invoice System

### Invoice Creation
```mermaid
sequenceDiagram
    participant User
    participant Clerk as Clerk Auth
    participant SuperPay as SuperPay App
    participant DB as Database
    participant CoinbaseSDK as Coinbase SDK
    participant AWSSes as AWS SES

    User->>SuperPay: [POST] /api/invoices { paymentCollection, items... (send=true?) }
    SuperPay->>Clerk: Middleware provides userId
    alt Auth success
        SuperPay->>DB: find user
        alt paymentCollection == "one-time"
            SuperPay->>CoinbaseSDK: Wallet.create() for invoice
            CoinbaseSDK->>CoinbaseSDK: generate {seed, walletId, address}
            CoinbaseSDK-->>SuperPay: walletData
            SuperPay->>SuperPay: encrypt seed with app key            
            SuperPay->>CBWebhook: listenToAddress(invoiceWalletAddress)
            Note over CBWebhook: If no erc20_transfer webhook, create it. Add this address to filters
            SuperPay->>DB: Insert new Invoice doc with { wallet: {address, seed: encrypted} }
            SuperPay->>AWSSes: sendEmail(InvoicePaymentEmail to invoice.email)
            AWSSes-->>SuperPay: success
        else paymentCollection == "multi-use"
            SuperPay->>DB: Insert new Invoice doc
            Note right of SuperPay: For multi-use, wallets created per checkout session
        end
        SuperPay-->>User: 201 Created (Invoice object)
    else Auth failure
        SuperPay-->>User: 401 Unauthorized
    end
```

### Invoice Payment Flow
```mermaid
sequenceDiagram
    participant Payer as External Payer
    participant SuperPay as SuperPay App
    participant DB as Database
    participant CoinbaseSDK as Coinbase SDK
    participant CBWebhook as Coinbase Webhook
    participant AWSSes as AWS SES

    Note over Payer,SuperPay: User visits invoice link

    alt paymentCollection == "one-time"
        SuperPay->>DB: Retrieve Invoice doc (with invoice.wallet.address)
        SuperPay-->>Payer: Show invoice address + QR
    else paymentCollection == "multi-use"
        Payer->>SuperPay: [POST] /api/invoice/checkout { invoiceId }
        SuperPay->>DB: Create ephemeral checkout session (with TTL)
        SuperPay->>CoinbaseSDK: Wallet.create() for ephemeral session
        CoinbaseSDK->>CoinbaseSDK: generate {seed, walletId, address}
        CoinbaseSDK-->>SuperPay: ephemeral wallet data
        SuperPay->>SuperPay: encrypt ephemeral seed
        SuperPay->>DB: store checkout session doc { address, encryptedSeed, expiresAt }
        SuperPay->>CBWebhook: listenToAddress(address)
        Note over CBWebhook: If no erc20_transfer webhook, create it. Add this address to filters
        SuperPay-->>Payer: Redirect to checkout session page with address + QR
    end

    Note over Payer,SuperPay: Payer connects wallet or does direct transfer for payment.

    Payer->>CoinbaseSDK: On-chain payment -> <address> (one-time or ephemeral)

    Note over CoinbaseSDK,CBWebhook: Payment is mined, coinbase indexes transfer
    CBWebhook-->>CBWebhook: triggers Webhook event (erc20_transfer to address)

    CBWebhook->>SuperPay: [POST] /api/webhook (transfer info)
    SuperPay->>DB: find invoice or session with matching address
    SuperPay->>SuperPay: validate amounts, ensure invoice or session is correct
    SuperPay->>DB: record payment in invoice (and session if multi-use)
    SuperPay->>CoinbaseSDK: Import address wallet (seed), transfer funds to invoice creator's main wallet
    CoinbaseSDK->>CoinbaseSDK: broadcast final transfer
    CoinbaseSDK-->>SuperPay: success

    Note over SuperPay,DB: If invoice fully paid -> unlisten address
    SuperPay->>CBWebhook: unlistenToAddress(address)

    SuperPay->>DB: mark invoice as fully/partially paid. 
    SuperPay->>AWSSes: sendEmail(InvoicePaymentConfirmationEmail to invoice.email)
    AWSSes-->>SuperPay: success

    SuperPay-->>Payer: Payment recorded
```

## System Architecture Overview
```mermaid
graph TD
    A[User Interface] --> B[Next.js App]
    subgraph Next.js App
        B --> C[Frontend Pages]
        B --> D[API Routes]
        B --> E[Clerk Auth]
    end
    D --> F[Database]
    D --> G[Coinbase SDK]
    D --> H[AWS SES]
    G --> I[Blockchain Network]
    D --> J[Webhook Handler]
    J --> F
    J --> G
```

## Data Flow Overview
```mermaid
graph LR
    A[User] --> B[Frontend]
    B --> C[API Routes]
    C --> D[Services]
    D --> E[External APIs]
    D --> F[Database]
    E --> G[Coinbase]
    E --> H[AWS]
    E --> I[Blockchain]
``` 