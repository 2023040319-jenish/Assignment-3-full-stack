const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const path = require("path");

const app = express();
const PORT = 3001;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    store: new FileStore({
        path: path.join(__dirname, "sessions"),
        retries: 1
    }),
    secret: "college-assignment-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 60 * 1000
    }
}));

// Accounts are kept in memory for this assignment and reset when the server restarts.
const users = [];

function isAuthenticated(req, res, next) {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect("/login");
    }
}

app.get("/", (req, res) => {
    if (req.session.isLoggedIn) {
        return res.redirect("/dashboard");
    }
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    if (req.session.isLoggedIn) {
        return res.redirect("/dashboard");
    }

    res.render("login", {
        error: null,
        registered: req.query.registered === "1"
    });
});

app.get("/register", (req, res) => {
    if (req.session.isLoggedIn) {
        return res.redirect("/dashboard");
    }

    res.render("register", { error: null });
});

app.post("/register", (req, res) => {
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!username || !password) {
        return res.status(400).render("register", {
            error: "Username and password are required."
        });
    }

    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).render("register", {
            error: "That username is already registered."
        });
    }

    users.push({ username, password });
    res.redirect("/login?registered=1");
});

app.post("/login", (req, res) => {
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = users.find(account =>
        account.username.toLowerCase() === username.toLowerCase() && account.password === password
    );

    if (user) {
        return req.session.regenerate(err => {
            if (err) {
                return res.status(500).send("Could not start a session.");
            }

            req.session.isLoggedIn = true;
            req.session.username = user.username;
            res.redirect("/dashboard");
        });
    }

    res.status(401).render("login", {
        error: "Invalid username or password.",
        registered: false
    });
});

// Protected Route 1
app.get("/dashboard", isAuthenticated, (req, res) => {
    res.render("dashboard", {
        username: req.session.username
    });
});

// Protected Route 2
app.get("/profile", isAuthenticated, (req, res) => {
    res.render("profile", {
        username: req.session.username
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Could not log out.");
        }

        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});

app.listen(PORT, () => {
    console.log(`Q2 server running at http://localhost:${PORT}`);
});