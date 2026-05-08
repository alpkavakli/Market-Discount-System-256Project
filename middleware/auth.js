export function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    if (!req.session.verified) {
        return res.redirect("/verify");
    }
    next();
}

export function redirectIfAuthed(req, res, next) {
    if (req.session.userId) {
        return res.redirect("/");
    }
    next();
}

