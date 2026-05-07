// Only for consumer users
/*
(5Pts)  A consumer can add products to a shopping cart. The shopping cart must be stored in the database and persist between user sessions.
(10Pts) In the shopping cart, the consumer can update the cart (e.g., remove items or change quantities), and the system should display the grand total. AJAX must be used for this functionality.
(5Pts)  The shopping cart page must include a "Purchase" button. When clicked, it should clear the cart and remove the purchased products from the system. AJAX must be used for this functionality.
*/

import express from "express"
import { pool } from "../dbpool.js"

const router = express.Router()
router.use(express.json()) // needed for AJAX requests

// ── Middleware: only consumers can access the cart ──────────────────────────
function requireConsumer(req, res, next) {
    if (!req.session.userId || req.session.role !== "consumer") {
        return res.redirect("/login")
    }
    next()
}

// ── Helper: calculate grand total from cart rows ─────────────────────────────
function calcGrandTotal(cartItems) {
    return cartItems.reduce((sum, item) => sum + item.discounted_price * item.quantity, 0)
}

// ── GET /shoppingcart ────────────────────────────────────────────────────────
// Show the cart page with all items for the logged-in consumer
router.get("/", requireConsumer, async (req, res) => {
    try {
        // Join cart_item with product and market_user to get all info we need for the view
        const [cartItems] = await pool.query(
            `SELECT 
                ci.id,
                ci.quantity,
                p.id AS product_id,
                p.title,
                p.discounted_price,
                p.stock,
                m.market_name
             FROM cart_item ci
             JOIN product p ON ci.product_id = p.id
             JOIN market_user m ON p.market_id = m.id
             WHERE ci.consumer_id = ?`,
            [req.session.userId]
        )

        res.render("shoppingcart_view", { cartItems })
    } catch (err) {
        console.error("Cart GET error:", err)
        res.status(500).send("Something went wrong.")
    }
})

// ── POST /shoppingcart/add ───────────────────────────────────────────────────
// Add a product to the cart (called from the products page)
// If it's already in the cart, increase quantity by 1
router.post("/add", requireConsumer, async (req, res) => {
    const { productId } = req.body

    if (!productId) {
        return res.json({ success: false, message: "Missing product ID." })
    }

    try {
        // Check if product exists and is not expired
        const [product] = await pool.query(
            `SELECT id, stock FROM product WHERE id = ? AND expiration_date >= CURDATE()`,
            [productId]
        )

        if (product.length === 0) {
            return res.json({ success: false, message: "Product not found or expired." })
        }

        // Insert or increment quantity (UNIQUE KEY on consumer_id + product_id handles duplicates)
        await pool.query(
            `INSERT INTO cart_item (consumer_id, product_id, quantity)
             VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
            [req.session.userId, productId]
        )

        res.json({ success: true })
    } catch (err) {
        console.error("Cart ADD error:", err)
        res.json({ success: false, message: "Something went wrong." })
    }
})

// ── POST /shoppingcart/update ────────────────────────────────────────────────
// Update quantity of a cart item (AJAX)
router.post("/update", requireConsumer, async (req, res) => {
    const { cartItemId, quantity } = req.body

    if (!cartItemId || !quantity || quantity < 1) {
        return res.json({ success: false, message: "Invalid input." })
    }

    try {
        // Make sure this cart item belongs to the logged-in consumer (security check)
        const [rows] = await pool.query(
            `SELECT ci.id, ci.product_id, p.discounted_price, p.stock
             FROM cart_item ci
             JOIN product p ON ci.product_id = p.id
             WHERE ci.id = ? AND ci.consumer_id = ?`,
            [cartItemId, req.session.userId]
        )

        if (rows.length === 0) {
            return res.json({ success: false, message: "Cart item not found." })
        }

        const item = rows[0]

        if (quantity > item.stock) {
            return res.json({ success: false, message: "Not enough stock." })
        }

        await pool.query(
            `UPDATE cart_item SET quantity = ? WHERE id = ?`,
            [quantity, cartItemId]
        )

        // Recalculate grand total for this consumer
        const [allItems] = await pool.query(
            `SELECT ci.quantity, p.discounted_price
             FROM cart_item ci
             JOIN product p ON ci.product_id = p.id
             WHERE ci.consumer_id = ?`,
            [req.session.userId]
        )

        const subtotal = item.discounted_price * quantity
        const grandTotal = calcGrandTotal(allItems)

        res.json({ success: true, subtotal, grandTotal })
    } catch (err) {
        console.error("Cart UPDATE error:", err)
        res.json({ success: false, message: "Something went wrong." })
    }
})

// ── POST /shoppingcart/remove ────────────────────────────────────────────────
// Remove a single item from the cart (AJAX)
router.post("/remove", requireConsumer, async (req, res) => {
    const { cartItemId } = req.body

    if (!cartItemId) {
        return res.json({ success: false, message: "Missing cart item ID." })
    }

    try {
        // Make sure this cart item belongs to the logged-in consumer (security check)
        const [rows] = await pool.query(
            `SELECT id FROM cart_item WHERE id = ? AND consumer_id = ?`,
            [cartItemId, req.session.userId]
        )

        if (rows.length === 0) {
            return res.json({ success: false, message: "Cart item not found." })
        }

        await pool.query(`DELETE FROM cart_item WHERE id = ?`, [cartItemId])

        // Recalculate grand total after removal
        const [allItems] = await pool.query(
            `SELECT ci.quantity, p.discounted_price
             FROM cart_item ci
             JOIN product p ON ci.product_id = p.id
             WHERE ci.consumer_id = ?`,
            [req.session.userId]
        )

        const grandTotal = calcGrandTotal(allItems)

        res.json({ success: true, grandTotal })
    } catch (err) {
        console.error("Cart REMOVE error:", err)
        res.json({ success: false, message: "Something went wrong." })
    }
})

// ── POST /shoppingcart/purchase ──────────────────────────────────────────────
// Complete the purchase: deduct stock from products, clear the cart (AJAX)
router.post("/purchase", requireConsumer, async (req, res) => {
    const conn = await pool.getConnection() // use a connection for transaction
    try {
        await conn.beginTransaction()

        // Get all cart items for this consumer
        const [cartItems] = await conn.query(
            `SELECT ci.product_id, ci.quantity, p.stock
             FROM cart_item ci
             JOIN product p ON ci.product_id = p.id
             WHERE ci.consumer_id = ?`,
            [req.session.userId]
        )

        if (cartItems.length === 0) {
            await conn.rollback()
            conn.release()
            return res.json({ success: false, message: "Your cart is empty." })
        }

        // Check stock and deduct for each item
        for (const item of cartItems) {
            if (item.quantity > item.stock) {
                await conn.rollback()
                conn.release()
                return res.json({ success: false, message: "Not enough stock for one or more items." })
            }

            await conn.query(
                `UPDATE product SET stock = stock - ? WHERE id = ?`,
                [item.quantity, item.product_id]
            )
        }

        // Clear the cart
        await conn.query(
            `DELETE FROM cart_item WHERE consumer_id = ?`,
            [req.session.userId]
        )

        await conn.commit()
        conn.release()

        res.json({ success: true })
    } catch (err) {
        await conn.rollback()
        conn.release()
        console.error("Purchase error:", err)
        res.json({ success: false, message: "Something went wrong." })
    }
})

export default router