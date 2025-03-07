import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

/**
 * Create an SES client. Make sure you have:
 *  process.env.AWS_REGION
 *  process.env.AWS_ACCESS_KEY_ID
 *  process.env.AWS_SECRET_ACCESS_KEY
 * set in your environment.
 */
const sesClient = new SESClient({
    region: process.env.AWS_REGION,
});

/**
 * Sends an email using AWS SES.
 *
 * @param to - The recipient's email address.
 * @param subject - The email subject.
 * @param bodyHtml - The email body in HTML format.
 * @param bodyText - (Optional) The email body in plain text.
 */
export async function sendEmail(
    to: string,
    subject: string,
    bodyHtml: string,
    bodyText?: string
) {
    try {
        const fromAddress = process.env.SES_FROM_ADDRESS;
        if (!fromAddress) {
            throw new Error("Missing SES_FROM_ADDRESS in environment.");
        }

        const params = {
            Destination: {
                ToAddresses: [to],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: bodyHtml,
                    },
                    ...(bodyText
                        ? {
                            Text: {
                                Charset: "UTF-8",
                                Data: bodyText,
                            },
                        }
                        : {}),
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: subject,
                },
            },
            Source: fromAddress,
        };

        const command = new SendEmailCommand(params);
        await sesClient.send(command);
    } catch (err) {
        console.error(`Email send failed (${to} | ${subject}): `, err)
    }
}
