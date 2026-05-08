import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import loginRoute from "./routes/login_route.js"
import signupRoute from "./routes/signup_route.js";
import shoppingcartRoute from "./routes/shoppingcart_route.js";
import productsRoute from "./routes/products_route.js";
import settingsRoute from "./routes/settings_route.js";
import verifyRoute from "./routes/verify_route.js";
import { pool } from "./dbpool.js";
import "dotenv/config";
//import bcrypt from "bcrypt"; //for login, hash -/ moved to signup and login
//import session from "express-session"; //I'm importing everything in main
import { sessionMiddleware } from "./controllers/session.js"; //session stuff
import { requireAuth, redirectIfAuthed } from "./middleware/auth.js";
import homeRoute from "./routes/home_route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;
const app = express();
app.set("view engine", "ejs"); //its auto views folder
app.set("views", path.join(__dirname, "views"));
//app.use("/asset", express.static("asset")); asset diye folder yok ki public var
app.use(sessionMiddleware); //this is needed for managing the sessions



app.use(express.static("public")) //ejslar view folderda publicte değil  
app.use(express.urlencoded({ extended: true }));  // to read HTML form posts
app.use(express.json()) //jsona fln çeviriyo işte parseluyo fln

//main shouldn't contain endpoints usually
app.use("/", homeRoute);
app.use("/login", redirectIfAuthed, loginRoute);   // /login is the path yani localhost:3000/login'de çalışıyo olacak
app.use("/verify", verifyRoute);
app.use("/signup", redirectIfAuthed, signupRoute);     
// app.use("/logout", requireAuth, logoutRoute);          // commented out
// app.use("/products", requireAuth, productsRoute);     // commented out
// app.use("/settings", requireAuth, settingsRoute);     // commented out
// app.use("/shoppingcart", requireAuth, shoppingcartRoute); // commented out

//bunları diğer routelar için de yazacağız işte
app.use("/shoppingcart", requireAuth, shoppingcartRoute);
app.use("/products",     requireAuth, productsRoute);
app.use("/settings",     requireAuth, settingsRoute);


app.listen(port, () => {
    console.log("Server started on " + port);
})

