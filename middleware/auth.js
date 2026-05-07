export function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    next();
}

export function redirectIfAuthed(req, res, next) {
    if (req.session.userId) {
        return res.redirect("/products");
    }
    next();
}

//İşte logluyla productsa gönderiyo değilse logine gönderiyo