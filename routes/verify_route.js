import express from "express";
import { pool } from "../dbpool.js";
import { generateCode, sendVerificationEmail } from "../controllers/mailer.js";

const router = express.Router();

function tableFor(role) {
    return role === "market" ? "market_user" : "consumer_user";
}

router.get("/", (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    if (req.session.verified) return res.redirect("/products");
    res.render("verify_view", { errorMessage: null, successMessage: null });
});

router.post("/", async (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    if (req.session.verified) return res.redirect("/products");

    const code = (req.body.code || "").trim();
    if (!/^\d{6}$/.test(code)) {
        return res.status(400).render("verify_view", {
            errorMessage: "Enter the 6-digit code.",
            successMessage: null,
        });
    }

    const table = tableFor(req.session.role);

    try {
        const [rows] = await pool.query(
            `SELECT verification_code, verification_expires FROM ${table} WHERE id = ? LIMIT 1`,
            [req.session.userId]
        );
        if (rows.length === 0) return req.session.destroy(() => res.redirect("/signup"));

        const user = rows[0];
        if (user.verification_code !== code) {
            return res.status(401).render("verify_view", {
                errorMessage: "Invalid code.",
                successMessage: null,
            });
        }
        if (!user.verification_expires || new Date(user.verification_expires) < new Date()) {
            return res.status(401).render("verify_view", {
                errorMessage: "Code expired. Click resend.",
                successMessage: null,
            });
        }

        await pool.query(
            `UPDATE ${table}
             SET is_verified = TRUE, verification_code = NULL, verification_expires = NULL
             WHERE id = ?`,
            [req.session.userId]
        );

        req.session.verified = true;
        res.redirect("/products");
    } catch (err) {
        console.error("Verify error:", err);
        res.status(500).render("verify_view", {
            errorMessage: "Something went wrong.",
            successMessage: null,
        });
    }
});

router.post("/resend", async (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    if (req.session.verified) return res.redirect("/products");

    const table = tableFor(req.session.role);

    try {
        const [rows] = await pool.query(
            `SELECT email FROM ${table} WHERE id = ? LIMIT 1`,
            [req.session.userId]
        );
        if (rows.length === 0) return req.session.destroy(() => res.redirect("/signup"));

        const code = generateCode();
        await pool.query(
            `UPDATE ${table}
             SET verification_code = ?, verification_expires = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
             WHERE id = ?`,
            [code, req.session.userId]
        );
        await sendVerificationEmail(rows[0].email, code);

        res.render("verify_view", {
            errorMessage: null,
            successMessage: "New code sent. Check your email.",
        });
    } catch (err) {
        console.error("Resend error:", err);
        res.status(500).render("verify_view", {
            errorMessage: "Couldn't send the code. Try again.",
            successMessage: null,
        });
    }
});

export default router;
