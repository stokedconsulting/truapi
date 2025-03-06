import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.scss";
import AppLayout from "@/layouts/AppLayout";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@coinbase/onchainkit/styles.css';
import { Providers } from "@/components/Providers";

const poppins = Poppins({ weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
    title: "SuperPay",
    description: "Powered by the Coinbase Developer Platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" type="image/x-icon" href="/favicon.png" />
                <meta name="color-scheme" content="only light" />
            </head>
            <body className={`${poppins.className}`}>
                <Providers>
                    <AppLayout>
                        {children}
                    </AppLayout>
                </Providers>
                <ToastContainer />
            </body>
        </html>
    );
}
