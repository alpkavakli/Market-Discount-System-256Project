//evet sadece session için ayrı bir folder açtım !!!!
//bazinga keep it professional

import session from "express-session";
import MySQLStoreFactory from "express-mysql-session"; // We need this zımbırtı for saving session info to mysql
import { pool } from "../dbpool.js";

const MySQLStore = MySQLStoreFactory(session); //sessionu bağladık factoryi oluşturduk we will use it below elhamdülillah

const store = new MySQLStore({
    createDatabaseTable: true,   // autocreates sessions table on first run its literally sql
    schema: {
        tableName: "sessions", //işte we are creating the table
        columnNames: {
            session_id: "session_id",
            expires: "expires",
            data: "data",
        },
    },
}, pool); //Is this part unnecessary? Check it later, i think we could just create this table in our sql files

export const sessionMiddleware = session({ //we are wrapping it as a middleware for later use
    //we can use req res next in session btw
    secret: process.env.SESSION_SECRET, //top sikrıt
    store, //for mysql
    resave: false, //dont re write unnecessarily
    saveUninitialized: false, //only create when logged in
    cookie: {
        httpOnly: true, //güvenlik
        secure: false,           // set true behind https in production
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,   // 7 days
    },
});

//bunu exportlamak gerekmiyo mu akkk

/* flow: User logs in → your handler does req.session.userId = 5.
express-session notices the change, calls store.set(...) → row written to sessions table with data = '{"userId":5}'.
Response sets Set-Cookie: connect.sid=<signed-id> on the browser.
Next request, browser sends that cookie → middleware looks up the row → req.session.userId is 5 again.
Server can restart, session survives because itss in MySQL.
*/