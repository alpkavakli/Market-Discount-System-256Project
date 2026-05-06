import express from "express"
const router = express.Router()
router.use(express.json())

// GET /signup - show signup page
router.get("/", (req, res) => {
    res.render("signup_view")
})

// POST /signup - handle form submission
router.post("/", async (req, res) => {
    // TODO: validate input, send verification email, insert user into DB
    const { user_type, email, password, full_name, market_name, city, district } = req.body
    res.send("signup POST received") // placeholder
})

export default router