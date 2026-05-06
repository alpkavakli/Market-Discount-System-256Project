//When a market user logs in, all expired products in the list should be clearly marked, so that the user is aware of products that have passed their expiration date.

import express from "express"
const router = express.Router()//it returns a router object which is almost similar to an app like app.get app.post and we can register endpoints and middlewares only for this router
router.use(express.json()) //if the content is json it parses it and adds it to req body


export default router;
