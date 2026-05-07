import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../dbpool.js";

const router = express.Router();

async function loadProfile(userId, role) {
    const table = role === "market" ? "market_user" : "consumer_user";
    const nameColumn = role === "market" ? "market_name" : "full_name";
    const [rows] = await pool.query(
        `SELECT email, ${nameColumn} AS name, city, district FROM ${table} WHERE id = ? LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
}

// GET /settings
router.get("/", async (req, res) => {
    try {
        const profile = await loadProfile(req.session.userId, req.session.role);
        if (!profile) {
            return req.session.destroy(() => res.redirect("/login"));
        }
        res.render("settings_view", {
            role: req.session.role,
            form: profile,
            errorMessage: null,
            successMessage: null,
        });
    } catch (err) {
        console.error("Settings GET error:", err);
        res.status(500).send("Something went wrong.");
    }
});

// POST /settings — update profile (requires current password)
router.post("/", async (req, res) => {
    const { userId, role } = req.session;
    const { email, name, city, district, currentPassword, newPassword, confirmNewPassword } = req.body;
    const form = { email, name, city, district };

    const renderError = (status, msg) =>
        res.status(status).render("settings_view", {
            role, form, errorMessage: msg, successMessage: null,
        });

    if (!email || !name || !city || !district) {
        return renderError(400, "Please fill in all fields.");
    }
    if (!currentPassword) {
        return renderError(400, "Enter your current password to confirm changes.");
    }
    if (newPassword || confirmNewPassword) {
        if (newPassword !== confirmNewPassword) {
            return renderError(400, "New passwords do not match.");
        }
        if (newPassword.length < 4) {
            return renderError(400, "New password must be at least 4 characters.");
        }
    }

    const table = role === "market" ? "market_user" : "consumer_user";
    const nameColumn = role === "market" ? "market_name" : "full_name";

    try {
        const [rows] = await pool.query(
            `SELECT password_hash FROM ${table} WHERE id = ? LIMIT 1`,
            [userId]
        );
        if (rows.length === 0) {
            return req.session.destroy(() => res.redirect("/login"));
        }
        const matches = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!matches) {
            return renderError(401, "Current password is incorrect.");
        }

        if (newPassword) {
            const passwordHash = await bcrypt.hash(newPassword, 10);
            await pool.query(
                `UPDATE ${table}
                 SET email = ?, ${nameColumn} = ?, city = ?, district = ?, password_hash = ?
                 WHERE id = ?`,
                [email, name, city, district, passwordHash, userId]
            );
        } else {
            await pool.query(
                `UPDATE ${table}
                 SET email = ?, ${nameColumn} = ?, city = ?, district = ?
                 WHERE id = ?`,
                [email, name, city, district, userId]
            );
        }

        res.render("settings_view", {
            role, form, errorMessage: null, successMessage: "Profile updated.",
        });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return renderError(409, "That email is already in use.");
        }
        console.error("Settings POST error:", err);
        renderError(500, "Something went wrong.");
    }
});

// POST /settings/delete — permanently delete account
router.post("/delete", async (req, res) => {
    const { userId, role } = req.session;
    const { deletePassword } = req.body;

    const renderErrorReload = async (status, msg) => {
        const profile = await loadProfile(userId, role);
        if (!profile) {
            return req.session.destroy(() => res.redirect("/login"));
        }
        res.status(status).render("settings_view", {
            role, form: profile, errorMessage: msg, successMessage: null,
        });
    };

    if (!deletePassword) {
        return renderErrorReload(400, "Enter your current password to delete your account.");
    }

    const table = role === "market" ? "market_user" : "consumer_user";

    try {
        const [rows] = await pool.query(
            `SELECT password_hash FROM ${table} WHERE id = ? LIMIT 1`,
            [userId]
        );
        if (rows.length === 0) {
            return req.session.destroy(() => res.redirect("/login"));
        }
        const matches = await bcrypt.compare(deletePassword, rows[0].password_hash);
        if (!matches) {
            return renderErrorReload(401, "Current password is incorrect.");
        }

        await pool.query(`DELETE FROM ${table} WHERE id = ?`, [userId]);
        req.session.destroy(() => res.redirect("/signup"));
    } catch (err) {
        console.error("Settings DELETE error:", err);
        renderErrorReload(500, "Something went wrong.");
    }
});

// POST /settings/logout
router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid"); // clears the session cookie from browser
        res.redirect("/login");
    });
})
export default router;
