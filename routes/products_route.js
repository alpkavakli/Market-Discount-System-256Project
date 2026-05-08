
import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { pool } from "../dbpool.js"

const router = express.Router()
router.use(express.json())


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

router.get("/", requireAuth, (req, res) => {
    if (req.session.role === "market") return res.redirect("/products/market")
    res.redirect("/products/consumer")
})



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

// POST 
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
      product.expiration_date = new Date(product.expiration_date).toLocaleDateString('en-CA')
        res.render("add_product", { errorMessage: null, form: product, editing: true })
    } catch (err) {
        res.status(500).send("Something went wrong.")
    }
})

// POST 
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

// POST 
router.post("/delete/:id", requireMarket, async (req, res) => {
    try {
        await pool.query(`DELETE FROM product WHERE id = ? AND market_id = ?`, [req.params.id, req.session.userId])
        res.redirect("/products/market")
    } catch (err) {
        res.status(500).send("Something went wrong.")
    }
})


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
 m.market_name, m.district AS market_district,
 DATEDIFF(p.expiration_date, CURDATE()) AS days_left,
 (m.district = ?) AS same_district
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



router.post("/add", requireConsumer, async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        return res.json({ success: false, message: "Ürün ID eksik." });
    }

    try {
        
        const [productRows] = await pool.query(
            "SELECT id, stock FROM product WHERE id = ? AND expiration_date >= CURDATE()",
            [productId]
        );

        if (productRows.length === 0) {
            return res.json({ success: false, message: "Ürün bulunamadı veya süresi geçmiş." });
        }

        const stock = productRows[0].stock;

        const [cartRows] = await pool.query(
            "SELECT quantity FROM cart_item WHERE consumer_id = ? AND product_id = ?", 
            [req.session.userId, productId]
        );

        if (cartRows.length > 0) {
            const currentQty = cartRows[0].quantity;

            
            if (currentQty >= stock) {
                return res.json({ success: false, message: "Yetersiz stok!" });
            }

            await pool.query(
                "UPDATE cart_item SET quantity = quantity + 1 WHERE consumer_id = ? AND product_id = ?",
                [req.session.userId, productId]
            );
        } else {
            
            await pool.query(
                "INSERT INTO cart_item (consumer_id, product_id, quantity) VALUES (?, ?, 1)",
                [req.session.userId, productId]
            );
        }

        
        res.json({ success: true });

    } catch (err) {
        
        console.error("Sepete ekleme hatası:", err);
        res.json({ success: false, message: "Bir hata oluştu." });
    }
});

export default router

