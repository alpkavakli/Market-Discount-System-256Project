//When a market user logs in, all expired products in the list should be clearly marked, so that the user is aware of products that have passed their expiration date.
import bcrypt from "bcrypt";
import express from "express";
import { pool } from "../dbpool.js";
const router = express.Router(); //it returns a router object which is almost similar to an app like app.get app.post and we can register endpoints and middlewares only for this router
router.use(express.json()); //if the content is json it parses it and adds it to req body

router.get("/", (req, res) => {
  //It means /login, not just /, we've implemented it in main
  res.render("login_view", {
    errorMessage: null,
    form: { email: "", role: "consumer", remember: false },
  });

});

router.post("/", async (req, res) => {
  const { email, password, role } = req.body;
  const form = { email, role, remember: !!req.body.remember };

  // db querysi, password checki, password hashing, starting a session must be done
  if (!email || !password || (role !== "consumer" && role !== "market")) {
    return res.status(400).render("login_view", {
      errorMessage: "Please fill in all fields.",
      form,
    });
  }
  const table = role === "market" ? "market_user" : "consumer_user";

  try {
    const [rows] = await pool.query(
      `SELECT id, password_hash, is_verified FROM ${table} WHERE email = ? LIMIT 1`,
      [email],
    );
    if (rows.length === 0) {
      return res.status(401).render("login_view", {
        errorMessage: "Invalid email or password.",
        form,
      });
    }

    const user = rows[0]; 
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).render("login_view", {
        errorMessage: "Invalid email or password.",
        form,
      });
    }

    req.session.userId = user.id;
    req.session.role = role;
    req.session.verified = !!user.is_verified;

    if (req.body.remember) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
    }

    if (!req.session.verified) {
      return res.redirect("/verify");
    }
    res.redirect("/products");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).render("login_view", {
      errorMessage: "Something went wrong. Try again.",
      form,
    });
  }
});
export default router;
