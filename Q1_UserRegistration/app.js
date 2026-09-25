const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { body, validationResult } = require("express-validator");

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, "uploads");
const profileDir = path.join(uploadDir, "profile");
const otherDir = path.join(uploadDir, "other");
const dataDir = path.join(__dirname, "data");

[uploadDir, profileDir, otherDir, dataDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "profilePic") {
            cb(null, profileDir);
        } else {
            cb(null, otherDir);
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const safeName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_-]/g, "_");
        cb(null, Date.now() + "-" + safeName + ext);
    }
});

const allowedTypes = /jpeg|jpg|png|gif/;

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, JPEG, PNG and GIF images are allowed."));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 6
    }
});

const validateRegistration = [
    body("username")
        .trim()
        .notEmpty().withMessage("Username is required.")
        .isLength({ min: 3, max: 30 }).withMessage("Username must be 3 to 30 characters."),

    body("password")
        .notEmpty().withMessage("Password is required.")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),

    body("confirmPassword")
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Passwords do not match."),

    body("email")
        .trim()
        .isEmail().withMessage("Enter a valid email address."),

    body("gender")
        .isIn(["Male", "Female", "Other"])
        .withMessage("Please select a valid gender."),

    body("hobbies")
        .custom(value => {
            if (!value) throw new Error("Select at least one hobby.");
            return true;
        })
];

function formValues(bodyData) {
    return {
        username: bodyData.username || "",
        password: bodyData.password || "",
        confirmPassword: bodyData.confirmPassword || "",
        email: bodyData.email || "",
        gender: bodyData.gender || "",
        hobbies: Array.isArray(bodyData.hobbies)
            ? bodyData.hobbies
            : (bodyData.hobbies ? [bodyData.hobbies] : [])
    };
}

function deleteUploadedFiles(files) {
    if (!files) return;

    Object.values(files).flat().forEach(file => {
        try {
            if (file && file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } catch (_) {}
    });
}

app.get("/", (req, res) => {
    res.render("register", {
        errors: [],
        values: {
            username: "",
            password: "",
            confirmPassword: "",
            email: "",
            gender: "",
            hobbies: []
        }
    });
});

app.post(
    "/register",
    upload.fields([
        { name: "profilePic", maxCount: 1 },
        { name: "otherPics", maxCount: 5 }
    ]),
    validateRegistration,
    (req, res) => {
        const errors = validationResult(req);
        const values = formValues(req.body);

        if (!req.files || !req.files.profilePic || req.files.profilePic.length === 0) {
            errors.errors.push({
                type: "field",
                value: "",
                msg: "Profile picture is required.",
                path: "profilePic",
                location: "body"
            });
        }

        if (!req.files || !req.files.otherPics || req.files.otherPics.length === 0) {
            errors.errors.push({
                type: "field",
                value: "",
                msg: "Upload at least one other picture.",
                path: "otherPics",
                location: "body"
            });
        }

        if (!errors.isEmpty()) {
            deleteUploadedFiles(req.files);

            return res.status(400).render("register", {
                errors: errors.array(),
                values
            });
        }

        const profilePic = req.files.profilePic[0];
        const otherPics = req.files.otherPics;

        const registration = {
            username: req.body.username,
            email: req.body.email,
            gender: req.body.gender,
            hobbies: Array.isArray(req.body.hobbies)
                ? req.body.hobbies
                : [req.body.hobbies],
            profilePic: {
                originalName: profilePic.originalname,
                fileName: profilePic.filename,
                url: "/uploads/profile/" + profilePic.filename
            },
            otherPics: otherPics.map(file => ({
                originalName: file.originalname,
                fileName: file.filename,
                url: "/uploads/other/" + file.filename
            })),
            submittedAt: new Date().toLocaleString()
        };

        const id = Date.now().toString();

        fs.writeFileSync(
            path.join(dataDir, id + ".json"),
            JSON.stringify(registration, null, 2)
        );

        res.render("result", { data: registration });
    }
);

app.get("/download-image/:type/:filename", (req, res) => {
    if (!["profile", "other"].includes(req.params.type)) {
        return res.status(404).send("Image not found.");
    }

    const folder = req.params.type === "profile" ? profileDir : otherDir;
    const filename = path.basename(req.params.filename);

    if (filename !== req.params.filename) {
        return res.status(404).send("Image not found.");
    }

    const file = path.join(folder, filename);
    if (!fs.existsSync(file)) {
        return res.status(404).send("Image not found.");
    }

    res.download(file);
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).render("register", {
            errors: [{ msg: err.code === "LIMIT_FILE_SIZE"
                ? "Each image must be 2 MB or smaller."
                : "File upload error: " + err.message }],
            values: formValues(req.body)
        });
    }

    if (err) {
        return res.status(400).render("register", {
            errors: [{ msg: err.message }],
            values: formValues(req.body)
        });
    }

    next(err);
});

app.listen(PORT, () => {
    console.log(`Q1 server running at http://localhost:${PORT}`);
});