alya burayı oku!!!
ctrl shift v ile render ediyoruz
# Design Decisions

## Login & Sign Up

In login and sign up pages there will be a dropdown that chooses if it is a customer or market user.

Login page will have a link to sign up page and vice versa.

Email verification will be left for later. The verification fields are already in the database schema (`is_verified`, `verification_code`, `verification_expires`) but the actual sending of confirmation codes via Nodemailer will be implemented in a later iteration.

## Sessions

After log in, a session will be started for the users, so we don't need to check who they are anymore. After this point it will be auto assumed that we know who is logged in.

The logout button will live on the `/settings` page. It hits `POST /logout` to destroy the session. The logout handler will be in its own route file.

## Routing

`/products` is the default page after logging in. Until then `/login` is the default page.

## Settings page (`/settings`)

Both users will be able to update/edit their info on `/settings` page.

## Products page (`/products`)

The path/route is the same for both user types but features will be different. The server will serve different EJS to consumer users and market users.

### Market user side

A market user can add a new product nearing its expiration date to their inventory. A product is defined by the following fields: title, stock, normal price, discounted price, expiration date, and an image. Example: "Toblerone 100gr", 25 pieces, 200 TL, 120 TL, 22-05-2026, and the product image.

We've interpreted this as: the market user is going to add the item to the system, and the customer users can only see items which are added to the system by market users. So market users see all items, customer users see items only added by market users. Therefore our application will only show items which are getting closer to expiration. If not, it won't show. And ensuring this will be done manually by market user.

A market user can edit and delete a product (including updating the product image).

When a market user logs in, all expired products in the list should be clearly marked, so that the user is aware of products that have passed their expiration date.

### Consumer user side

A consumer can search for products using keywords (search bar). The system should return all products that match the keyword either exactly or partially. For example, searching for the keyword "mag" should return products such as "magnum", "magnolia-cake", "nutmeg", etc.

The results should include only products in the same city as the consumer and give priority to products in the same district. Expired products must not be included in the results. The results should be paginated with a page size of 4 products.

A consumer can add products to a shopping cart. The shopping cart must be stored in the database and persist between user sessions.

When the consumer hasn't searched anything yet, the page shows all non-expired products in their city by default. Products are sorted by expiration date ascending (closest-to-expiring first), with district priority — products in the same district as the consumer come first, then the rest of the city.

## Shopping cart (`/shoppingcart`)

In the shopping cart, the consumer can update the cart (e.g., remove items or change quantities), and the system should display the grand total. AJAX must be used for this functionality.

The shopping cart page must include a "Purchase" button. When clicked, it should clear the cart and remove the purchased products from the system. AJAX must be used for this functionality.

"Remove the purchased products from the system" is interpreted as: decrement the product's stock by the purchased quantity. The product row is only deleted when stock hits 0.