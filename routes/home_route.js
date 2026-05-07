import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
    if (req.session.userId) return res.redirect("/products");
    res.redirect("/login");
});

export default router;
