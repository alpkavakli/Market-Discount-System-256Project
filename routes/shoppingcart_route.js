//Only for consumer user
/*
(5Pts) A consumer can add products to a shopping cart. The shopping cart must be stored in the database and persist between user sessions.
(10Pts) In the shopping cart, the consumer can update the cart (e.g., remove items or change quantities), and the system should display the grand total. AJAX must be used for this functionality.
(5Pts) The shopping cart page must include a "Purchase" button. When clicked, it should clear the cart and remove the purchased products from the system. AJAX must be used for this functionality.

*/

import express from "express"
const router = express.Router()
router.use(express.json()) //ajax için lazım, otomatik parse vs

//GET /shoppingcart need it to show cart page
router.get("/", (req, res) => {
    // TODO: get session user, we have to fetch cart items from DB
    //finds ejs and sends to browser, cartItems bizim data
    const cartItems = [] // placeholder
    res.render("shoppingcart_view", { cartItems })
})

// POST /shoppingcart/update - update item quantity, ajax 
router.post("/update", async (req, res) => {
    const { cartItemId, quantity } = req.body
    // TODO: update quantity in DB, recalculate totals
    //shoppingcart.ejs receives and uses data.success, data.subtotal vs to update page without reloading 
    res.json({ success: true, subtotal: 0, grandTotal: 0 }) // placeholder
})

// POST /shoppingcart/remove - remove item from cart (AJAX)
router.post("/remove", async (req, res) => {
    const { cartItemId } = req.body
    // TODO: delete cart item from DB, recalculate ttoal in shoppingcart
    res.json({ success: true, grandTotal: 0 }) // placeholder
})

// POST /shoppingcart/purchase - complete purchase (AJAX)
router.post("/purchase", async (req, res) => {
    // TODO: deduct stock, clear shopping cart in DB
    res.json({ success: true }) // placeholder
})

export default router