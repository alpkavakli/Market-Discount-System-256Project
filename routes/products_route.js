//Different for consumer users and market users

//Market users can add products near expiration date and also delete if exp date passed
import express from "express"
const router = express.Router()
router.use(express.json())

// GET /products - show products page (search results)
router.get("/", (req, res) => {
    const { keyword, page } = req.query
    // TODO: search products by keyword, filter by consumer's city/district, paginate (page size 4)
    const products = []   // placeholder
    const currentPage = parseInt(page) || 1
    const totalPages = 1  // placeholder
    res.render("products_view", { products, keyword, currentPage, totalPages })
})

export default router