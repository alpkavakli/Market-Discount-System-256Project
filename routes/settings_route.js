//To update/edit own info, applicable for both users.

import express from "express"
const router = express.Router()//it returns a router object which is almost similar to an app like app.get app.post and we can register endpoints and middlewares only for this router
router.use(express.json()) //if the content is json it parses it and adds it to req body

router.get("/settings", (req, res) => {
    res.render("settings_view");
})

router.post("/logout", (req, res) => {
   req.session.destroy(() => res.redirect("/login"));

 })
export default router;
