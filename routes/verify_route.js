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
      `SELECT verification_code,
              (verification_expires > NOW()) AS is_valid
       FROM ${table} WHERE id = ? LIMIT 1`,
      [req.session.userId],
    );
    if (rows.length === 0)
      return req.session.destroy(() => res.redirect("/signup"));

    const user = rows[0];
    if (user.verification_code !== code) {
      return res.status(401).render("verify_view", {
        errorMessage: "Invalid code.",
        successMessage: null,
      });
    }
    if (!user.is_valid) {
      return res.status(401).render("verify_view", {
        errorMessage: "Code expired. Click resend.",
        successMessage: null,
      });
    }

    await pool.query(
      `UPDATE ${table}
             SET is_verified = TRUE, verification_code = NULL, verification_expires = NULL
             WHERE id = ?`,
      [req.session.userId],
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
      [req.session.userId],
    );
    if (rows.length === 0)
      return req.session.destroy(() => res.redirect("/signup"));

    const code = generateCode();
    await pool.query(
      `UPDATE ${table}
             SET verification_code = ?, verification_expires = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
             WHERE id = ?`,
      [code, req.session.userId],
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

router.post("/cancel", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  if (req.session.verified) return res.redirect("/products");

  const role = req.session.role;
  const table = tableFor(role);
  const nameColumn = role === "market" ? "market_name" : "full_name";

  try {
    const [rows] = await pool.query(
      `SELECT email, ${nameColumn} AS name, city, district
             FROM ${table} WHERE id = ? LIMIT 1`,
      [req.session.userId],
    );

    await pool.query(
      `DELETE FROM ${table} WHERE id = ? AND is_verified = FALSE`,
      [req.session.userId],
    );

    // Clear auth fields, but keep the session alive to carry the form data
    delete req.session.userId;
    delete req.session.role;
    delete req.session.verified;

    if (rows[0]) {
      req.session.signupForm = {
        email: rows[0].email,
        name: rows[0].name,
        role,
        city: rows[0].city,
        district: rows[0].district,
      };
    }

    req.session.save((err) => {
      if (err) console.error("Session save error:", err);
      res.redirect("/signup");
    });
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).render("verify_view", {
      errorMessage: "Couldn't cancel. Try again.",
      successMessage: null,
    });
  }
});

export default router;
