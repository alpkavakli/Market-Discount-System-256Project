//To update/edit own info, applicable for both users.
import express from "express"
const router = express.Router()
router.use(express.json())

// GET /settings - show settings/edit profile page
router.get("/", (req, res) => {
    // TODO: get session user, pass their info to the view
    res.render("settings_view", { user: null }) // placeholder
})

// POST /settings - handle profile update form
router.post("/", async (req, res) => {
    // TODO: validate input, update user info in DB
    res.send("settings POST received") // placeholder
})

export default router