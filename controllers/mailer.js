import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendVerificationEmail(toEmail, code) {
    return transporter.sendMail({
        from: process.env.SMTP_FROM || `"Discount Marketplace" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: "Your verification code",
        text: `Your verification code is: ${code}\nIt expires in 15 minutes.`,
        html: `<p>Your verification code is: <strong style="font-size:1.5em;">${code}</strong></p><p>It expires in 15 minutes.</p>`,
    });
}
