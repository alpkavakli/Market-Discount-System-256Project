import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    if (!req.session.verified) return res.redirect("/verify");
    res.redirect("/products");
});


export default router;
