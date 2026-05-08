//Different for consumer users and market users

//Market users can add products near expiration date and also delete if exp date passed
/*import express from "express"
const router = express.Router()
router.use(express.json())

// GET /products - show products page (search results)
router.get("/", (req, res) => {
    const { keyword, page } = req.query
    // TODO: search products by keyword, filter by consumer's city/district, paginate (page size 4)
    const products = []   // placeholder
    const currentPage = parseInt(page) || 1
    const totalPages = 1  // placeholder
    res.render("consumer_product", { products, keyword, currentPage, totalPages })
})

export default router*/
// products_route.js
// Market: add / edit / delete own products (with image upload)
// Consumer: search products by keyword, city-filtered, district-prioritised, paginated (4/page)

/*
import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { pool } from "../dbpool.js"

const router = express.Router()
router.use(express.json())

// ── Multer: save product images to public/uploads/products ───────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "public/uploads/products"
        fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        // unique filename: timestamp + original extension
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}${ext}`)
    },
})
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true)
        else cb(new Error("Only image files are allowed."))
    },
})

// ── Middleware ────────────────────────────────────────────────────────────────
function requireMarket(req, res, next) {
    if (!req.session.userId || req.session.role !== "market") return res.redirect("/login")
    next()
}

function requireConsumer(req, res, next) {
    if (!req.session.userId || req.session.role !== "consumer") return res.redirect("/login")
    next()
}

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.redirect("/login")
    next()
}

// ── GET /products ─────────────────────────────────────────────────────────────
// Redirect to the right view based on role
router.get("/", requireAuth, (req, res) => {
    if (req.session.role === "market") return res.redirect("/products/market")
    res.redirect("/products/consumer")
})

// ══════════════════════════════════════════════════════════════════════════════
//  MARKET ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /products/market ──────────────────────────────────────────────────────
// Show this market's products. Expired ones are flagged.
router.get("/market", requireMarket, async (req, res) => {
    try {
        const [products] = await pool.query(
            `SELECT 
                id, title, stock, normal_price, discounted_price,
                expiration_date, image_path,
                expiration_date < CURDATE() AS is_expired
             FROM product
             WHERE market_id = ?
             ORDER BY is_expired ASC, expiration_date ASC`,
            [req.session.userId]
        )

        res.render("market_product", { products })
    } catch (err) {
        console.error("Market products GET error:", err)
        res.status(500).send("Something went wrong.")
    }
})

// ── GET /products/add ─────────────────────────────────────────────────────────
// Show add-product form
router.get("/add", requireMarket, (req, res) => {
    res.render("add_product", { errorMessage: null, form: {} })
})

// ── POST /products/add ────────────────────────────────────────────────────────
// Handle new product submission (with image)
router.post("/add", requireMarket, upload.single("image"), async (req, res) => {
    const { title, stock, normal_price, discounted_price, expiration_date } = req.body
    const form = { title, stock, normal_price, discounted_price, expiration_date }

    if (!title || !stock || !normal_price || !discounted_price || !expiration_date || !req.file) {
        if (req.file) fs.unlinkSync(req.file.path) // clean up orphaned upload
        return res.status(400).render("add_product", {
            errorMessage: "Please fill in all fields and upload an image.",
            form,
        })
    }

    if (parseFloat(discounted_price) >= parseFloat(normal_price)) {
        fs.unlinkSync(req.file.path)
        return res.status(400).render("add_product", {
            errorMessage: "Discounted price must be less than normal price.",
            form,
        })
    }

    const image_path = `uploads/products/${req.file.filename}`

    try {
        await pool.query(
            `INSERT INTO product (market_id, title, stock, normal_price, discounted_price, expiration_date, image_path)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.session.userId, title, stock, normal_price, discounted_price, expiration_date, image_path]
        )

        res.redirect("/products/market")
    } catch (err) {
        fs.unlinkSync(req.file.path)
        console.error("Add product error:", err)
        res.status(500).render("add_product", {
            errorMessage: "Something went wrong. Try again.",
            form,
        })
    }
})

// ── GET /products/edit/:id ────────────────────────────────────────────────────
// Show edit form pre-filled with existing product data
router.get("/edit/:id", requireMarket, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM product WHERE id = ? AND market_id = ?`,
            [req.params.id, req.session.userId]
        )

        if (rows.length === 0) return res.status(404).send("Product not found.")

        const product = rows[0]
        // Format date for <input type="date"> (YYYY-MM-DD)
        product.expiration_date = product.expiration_date.toISOString().split("T")[0]

        res.render("add_product", { errorMessage: null, form: product, editing: true })
    } catch (err) {
        console.error("Edit GET error:", err)
        res.status(500).send("Something went wrong.")
    }
})

// ── POST /products/edit/:id ───────────────────────────────────────────────────
// Save edits; optionally replace image
router.post("/edit/:id", requireMarket, upload.single("image"), async (req, res) => {
    const { title, stock, normal_price, discounted_price, expiration_date } = req.body
    const form = { id: req.params.id, title, stock, normal_price, discounted_price, expiration_date }

    if (!title || !stock || !normal_price || !discounted_price || !expiration_date) {
        if (req.file) fs.unlinkSync(req.file.path)
        return res.status(400).render("add_product", {
            errorMessage: "Please fill in all fields.",
            form,
            editing: true,
        })
    }

    if (parseFloat(discounted_price) >= parseFloat(normal_price)) {
        if (req.file) fs.unlinkSync(req.file.path)
        return res.status(400).render("add_product", {
            errorMessage: "Discounted price must be less than normal price.",
            form,
            editing: true,
        })
    }

    try {
        // Verify ownership
        const [rows] = await pool.query(
            `SELECT image_path FROM product WHERE id = ? AND market_id = ?`,
            [req.params.id, req.session.userId]
        )
        if (rows.length === 0) return res.status(404).send("Product not found.")

        let image_path = rows[0].image_path

        if (req.file) {
            // Delete old image file and use new one
            const oldPath = `public/${image_path}`
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
            image_path = `uploads/products/${req.file.filename}`
        }

        await pool.query(
            `UPDATE product
             SET title = ?, stock = ?, normal_price = ?, discounted_price = ?,
                 expiration_date = ?, image_path = ?
             WHERE id = ? AND market_id = ?`,
            [title, stock, normal_price, discounted_price, expiration_date, image_path, req.params.id, req.session.userId]
        )

        res.redirect("/products/market")
    } catch (err) {
        if (req.file) fs.unlinkSync(req.file.path)
        console.error("Edit POST error:", err)
        res.status(500).render("add_product", {
            errorMessage: "Something went wrong. Try again.",
            form,
            editing: true,
        })
    }
})

// ── POST /products/delete/:id ─────────────────────────────────────────────────
// Delete a product and its image file
router.post("/delete/:id", requireMarket, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT image_path FROM product WHERE id = ? AND market_id = ?`,
            [req.params.id, req.session.userId]
        )

        if (rows.length === 0) return res.status(404).send("Product not found.")

        const imgPath = `public/${rows[0].image_path}`
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)

        await pool.query(`DELETE FROM product WHERE id = ? AND market_id = ?`, [req.params.id, req.session.userId])

        res.redirect("/products/market")
    } catch (err) {
        console.error("Delete error:", err)
        res.status(500).send("Something went wrong.")
    }
})

// ══════════════════════════════════════════════════════════════════════════════
//  CONSUMER ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /products/consumer ────────────────────────────────────────────────────
// Search + browse; city-filtered, district-prioritised, paginated (4 per page)
router.get("/consumer", requireConsumer, async (req, res) => {
    const keyword = (req.query.keyword || "").trim()
    const page    = Math.max(1, parseInt(req.query.page) || 1)
    const limit   = 4
    const offset  = (page - 1) * limit

    try {
        // Get consumer's city & district for filtering / prioritisation
        const [consumerRows] = await pool.query(
            `SELECT city, district FROM consumer_user WHERE id = ?`,
            [req.session.userId]
        )
        const { city, district } = consumerRows[0]

        // Build WHERE clause — keyword is optional
        const likeKeyword = `%${keyword}%`
        const params = [city, likeKeyword, district]

        // Count total matching rows (for pagination)
        const [countRows] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM product p
             JOIN market_user m ON p.market_id = m.id
             WHERE m.city = ?
               AND p.expiration_date >= CURDATE()
               AND p.title LIKE ?
               AND p.stock > 0`,
            [city, likeKeyword]
        )
        const total = countRows[0].total
        const totalPages = Math.ceil(total / limit)

        // Fetch page — same-district rows come first
        const [products] = await pool.query(
            `SELECT 
                p.id, p.title, p.stock,
                p.normal_price, p.discounted_price,
                p.expiration_date, p.image_path,
                m.market_name, m.district AS market_district,
                DATEDIFF(p.expiration_date, CURDATE()) AS days_left,
                (m.district = ?) AS same_district
             FROM product p
             JOIN market_user m ON p.market_id = m.id
             WHERE m.city = ?
               AND p.expiration_date >= CURDATE()
               AND p.title LIKE ?
               AND p.stock > 0
             ORDER BY same_district DESC, p.expiration_date ASC
             LIMIT ? OFFSET ?`,
            [district, city, likeKeyword, limit, offset]
        )

        res.render("consumer_product", {
            products,
            keyword,
            page,
            totalPages,
            total,
        })
    } catch (err) {
        console.error("Consumer products GET error:", err)
        res.status(500).send("Something went wrong.")
    }
})

// ── POST /products/consumer/add-to-cart ──────────────────────────────────────
// Delegate to shopping cart route (AJAX, called from consumer_product.ejs)
// We keep the add logic in shoppingcart_route.js — this just proxies the call
// so the button can POST to /products/consumer/add-to-cart if preferred,
// OR you can call /shoppingcart/add directly from the view. Either works.
// (Kept here as a convenience alias — feel free to remove if not needed.)
router.post("/consumer/add-to-cart", requireConsumer, async (req, res) => {
    const { productId } = req.body
    if (!productId) return res.json({ success: false, message: "Missing product ID." })

    try {
        const [product] = await pool.query(
            `SELECT id, stock FROM product WHERE id = ? AND expiration_date >= CURDATE() AND stock > 0`,
            [productId]
        )
        if (product.length === 0)
            return res.json({ success: false, message: "Product not available." })

        await pool.query(
            `INSERT INTO cart_item (consumer_id, product_id, quantity)
             VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
            [req.session.userId, productId]
        )

        res.json({ success: true })
    } catch (err) {
        console.error("Add to cart error:", err)
        res.json({ success: false, message: "Something went wrong." })
    }
})

export default router

*/



import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { pool } from "../dbpool.js"

const router = express.Router()
router.use(express.json())

// -- Multer Ayarları --
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "public/uploads/products"
        fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}${ext}`)
    },
})
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true)
        else cb(new Error("Only image files are allowed."))
    },
})

// -- Middleware Fonksiyonları --
function requireMarket(req, res, next) {
    if (!req.session.userId || req.session.role !== "market") return res.redirect("/login")
    next()
}
function requireConsumer(req, res, next) {
    if (!req.session.userId || req.session.role !== "consumer") return res.redirect("/login")
    next()
}
function requireAuth(req, res, next) {
    if (!req.session.userId) return res.redirect("/login")
    next()
}

// -- Temel Yönlendirme --
router.get("/", requireAuth, (req, res) => {
    if (req.session.role === "market") return res.redirect("/products/market")
    res.redirect("/products/consumer")
})

// -- MARKET YOLLARI --

router.get("/market", requireMarket, async (req, res) => {
    try {
        const [products] = await pool.query(
            `SELECT id, title, stock, normal_price, discounted_price, expiration_date, image_path,
             expiration_date < CURDATE() AS is_expired
             FROM product WHERE market_id = ?
             ORDER BY is_expired ASC, expiration_date ASC`,
            [req.session.userId]
        )
        res.render("market_product", { products })
    } catch (err) {
        console.error(err)
        res.status(500).send("Something went wrong.")
    }
})

router.get("/add", requireMarket, (req, res) => {
    res.render("add_product", { errorMessage: null, form: {} })
})

// POST /products/add (unlinkSync kaldırıldı)
router.post("/add", requireMarket, upload.single("image"), async (req, res) => {
    const { title, stock, normal_price, discounted_price, expiration_date } = req.body
    const form = { title, stock, normal_price, discounted_price, expiration_date }

    if (!title || !stock || !normal_price || !discounted_price || !expiration_date || !req.file) {
        return res.status(400).render("add_product", {
            errorMessage: "Please fill in all fields and upload an image.",
            form,
        })
    }

    if (parseFloat(discounted_price) >= parseFloat(normal_price)) {
        return res.status(400).render("add_product", {
            errorMessage: "Discounted price must be less than normal price.",
            form,
        })
    }

    const image_path = `uploads/products/${req.file.filename}`

    try {
        await pool.query(
            `INSERT INTO product (market_id, title, stock, normal_price, discounted_price, expiration_date, image_path)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.session.userId, title, stock, normal_price, discounted_price, expiration_date, image_path]
        )
        res.redirect("/products/market")
    } catch (err) {
        console.error(err)
        res.status(500).render("add_product", {
            errorMessage: "Something went wrong. Try again.",
            form,
        })
    }
})

router.get("/edit/:id", requireMarket, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM product WHERE id = ? AND market_id = ?`,
            [req.params.id, req.session.userId]
        )
        if (rows.length === 0) return res.status(404).send("Product not found.")
        const product = rows[0]
        product.expiration_date = product.expiration_date.toISOString().split("T")[0]
        res.render("add_product", { errorMessage: null, form: product, editing: true })
    } catch (err) {
        res.status(500).send("Something went wrong.")
    }
})

// POST /products/edit/:id (unlinkSync kaldırıldı)
router.post("/edit/:id", requireMarket, upload.single("image"), async (req, res) => {
    const { title, stock, normal_price, discounted_price, expiration_date } = req.body
    const form = { id: req.params.id, title, stock, normal_price, discounted_price, expiration_date }

    if (!title || !stock || !normal_price || !discounted_price || !expiration_date) {
        return res.status(400).render("add_product", {
            errorMessage: "Please fill in all fields.",
            form, editing: true,
        })
    }

    try {
        const [rows] = await pool.query(
            `SELECT image_path FROM product WHERE id = ? AND market_id = ?`,
            [req.params.id, req.session.userId]
        )
        if (rows.length === 0) return res.status(404).send("Product not found.")

        let image_path = rows[0].image_path
        if (req.file) {
            image_path = `uploads/products/${req.file.filename}`
        }

        await pool.query(
            `UPDATE product SET title = ?, stock = ?, normal_price = ?, discounted_price = ?,
             expiration_date = ?, image_path = ? WHERE id = ? AND market_id = ?`,
            [title, stock, normal_price, discounted_price, expiration_date, image_path, req.params.id, req.session.userId]
        )
        res.redirect("/products/market")
    } catch (err) {
        res.status(500).render("add_product", {
            errorMessage: "Something went wrong.",
            form, editing: true,
        })
    }
})

// POST /products/delete/:id (unlinkSync kaldırıldı)
router.post("/delete/:id", requireMarket, async (req, res) => {
    try {
        await pool.query(`DELETE FROM product WHERE id = ? AND market_id = ?`, [req.params.id, req.session.userId])
        res.redirect("/products/market")
    } catch (err) {
        res.status(500).send("Something went wrong.")
    }
})

// -- CONSUMER YOLLARI --

router.get("/consumer", requireConsumer, async (req, res) => {
    const keyword = (req.query.keyword || "").trim()
    const page    = Math.max(1, parseInt(req.query.page) || 1)
    const limit   = 4
    const offset  = (page - 1) * limit

    try {
        const [consumerRows] = await pool.query(`SELECT city, district FROM consumer_user WHERE id = ?`, [req.session.userId])
        const { city, district } = consumerRows[0]
        const likeKeyword = `%${keyword}%`

        const [countRows] = await pool.query(
            `SELECT COUNT(*) AS total FROM product p JOIN market_user m ON p.market_id = m.id
             WHERE m.city = ? AND p.expiration_date >= CURDATE() AND p.title LIKE ? AND p.stock > 0`,
            [city, likeKeyword]
        )
        const total = countRows[0].total
        const totalPages = Math.ceil(total / limit)

        const [products] = await pool.query(
            `SELECT p.id, p.title, p.stock, p.normal_price, p.discounted_price, p.expiration_date, p.image_path,
             m.market_name, m.district AS market_district, (m.district = ?) AS same_district
             FROM product p JOIN market_user m ON p.market_id = m.id
             WHERE m.city = ? AND p.expiration_date >= CURDATE() AND p.title LIKE ? AND p.stock > 0
             ORDER BY same_district DESC, p.expiration_date ASC LIMIT ? OFFSET ?`,
            [district, city, likeKeyword, limit, offset]
        )

        res.render("consumer_product", { products, keyword, page, totalPages, total })
    } catch (err) {
        res.status(500).send("Something went wrong.")
    }
})

router.post("/consumer/add-to-cart", requireConsumer, async (req, res) => {
    const { productId } = req.body
    if (!productId) return res.json({ success: false, message: "Missing product ID." })

    try {
        const [product] = await pool.query(`SELECT id FROM product WHERE id = ? AND expiration_date >= CURDATE() AND stock > 0`, [productId])
        if (product.length === 0) return res.json({ success: false, message: "Product not available." })

        await pool.query(
            `INSERT INTO cart_item (consumer_id, product_id, quantity) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
            [req.session.userId, productId]
        )
        res.json({ success: true })
    } catch (err) {
        res.json({ success: false, message: "Something went wrong." })
    }
})

export default router

