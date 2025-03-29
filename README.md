
<img src="public/assets/superpay-logo.svg" alt="SuperPay Logo" width="200"/>
<hr/>

![Next.js](https://img.shields.io/badge/-Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/-SCSS-cd6799?style=for-the-badge&logo=SASS&logoColor=white)
![Coinbase](https://img.shields.io/badge/Coinbase-0052FF?style=for-the-badge&logo=Coinbase&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)


A full-stack Next.js application for managing crypto payments and invoices using Coinbase's infrastructure.

## Prerequisites

- Git
- Node.js (v18 or higher)
- MongoDB
- AWS Account (for SES)
- Coinbase Developer Platform (CDP) Account
- Clerk Account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# MongoDB
MONGODB_URI=your_mongodb_uri

# Coinbase
CDP_API_KEY_NAME=your_coinbase_api_key_name
CDP_API_PRIVATE_KEY=your_coinbase_private_key
NEXT_PUBLIC_APP_ENV=development # or production

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region

# Webhook
NEXT_PUBLIC_WEBHOOK_URL=your_webhook_url
```

## Getting Started

1. Clone the repository:
```sh
git clone https://github.com/heimlabs/coinbase-superpay.git
cd coinbase-superpay
```

2. Install dependencies:
```sh
pnpm install
```

3. Set up your environment variables as described above.

4. Start the development server:
```sh
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

```sh
pnpm build
```

To start the production server:
```sh
pnpm start
```

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/models` - MongoDB models
- `/lib` - Utility functions and service integrations
- `/public` - Static assets
- `/src/assets` - SVG icons and other assets

## System Architecture

For detailed information about the system architecture and user flows, please refer to our [DIAGRAMS.md](./DIAGRAMS.md) file.

## Features

- 🔐 Secure authentication with Clerk
- 💰 Crypto wallet management
- 💸 Asset transfers and trading
- 📄 Invoice creation and management
- 📧 Email notifications via AWS SES
- 🔄 Webhook handling for payment events
- 📱 Responsive design

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

