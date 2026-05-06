import express from "express";
import loginRoute from "./routes/login_route.js"
import signupRoute from "./routes/signup_route.js";
import shoppingcartRoute from "./routes/shoppingcart_route.js";
import productsRoute from "./routes/products_route.js";
import settingsRoute from "./routes/settings_route.js";
import { pool } from "./dbpool.js";
import "dotenv/config";

const port = process.env.PORT || 3000;
const app = express();
app.set("view engine", "ejs"); //its auto views folder
//app.use("/asset", express.static("asset")); asset diye folder yok ki public var
app.use(express.static("public")) //ejslar view folderda publicte değil  
app.use(express.urlencoded({ extended: true }));  // to read HTML form posts
app.use(express.json()) //jsona fln çeviriyo işte parseluyo fln


//main shouldn't contain endpoints usually
app.use("/login", loginRoute) // /login is the path yani localhost:3000/login'de çalışıyo olacak
//bunları diğer routelar için de yazacağız işte
app.use("/signup", signupRoute);
app.use("/shoppingcart", shoppingcartRoute);
app.use("/products", productsRoute);
app.use("/settings", settingsRoute);

app.listen(port, () => {
    console.log("Server started on " + port);
})

