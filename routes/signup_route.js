import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../dbpool.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("signup_view", {
    errorMessage: null,
    form: { email: "", role: "consumer", name: "", city: "", district: "" },
  });
});

router.post("/", async (req, res) => {
  const { email, password, role, name, city, district } = req.body;
  const form = { email, role, name, city, district }; // reused for sticky form

  if (
    !email ||
    !password ||
    !name ||
    !city ||
    !district ||
    (role !== "consumer" && role !== "market")
  ) {
    return res.status(400).render("signup_view", {
      errorMessage: "Please fill in all fields.",
      form,
    });
  }

  if (password.length < 4) {
    return res.status(400).render("signup_view", {
      errorMessage: "Password must be at least 4 characters.",
      form,
    });
  }

  const table = role === "market" ? "market_user" : "consumer_user";
  const nameColumn = role === "market" ? "market_name" : "full_name";

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO ${table} (email, ${nameColumn}, password_hash, city, district)
             VALUES (?, ?, ?, ?, ?)`,
      [email, name, passwordHash, city, district],
    );

    req.session.userId = result.insertId;
    req.session.role = role;
    res.redirect("/products");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).render("signup_view", {
        errorMessage: "An account with this email already exists.",
        form,
      });
    }
    console.error("Signup error:", err);
    res.status(500).render("signup_view", {
      errorMessage: "Something went wrong. Try again.",
      form,
    });
  }
});

export default router;
