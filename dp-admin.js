const express = require("express")
const exphbs = require("express-handlebars")
const dotenv = require("dotenv")
const connectDB = require("./config/db")
const session = require('express-session');
const MongoStore = require("connect-mongo");
const path = require('path');
const hbsHelpers = require('./modules/helpers');
const Settings = require('./models/Settings');
const Ticket = require('./models/Ticket');

const authRoutes = require("./routes/authRoutes")
const homeRoutes = require("./routes/homeRoutes")
const userRoutes = require("./routes/userRoutes")
const contentRoutes = require("./routes/contentRoutes")
const blogRoutes = require("./routes/blogRoutes")
const settingsRoutes = require("./routes/settingsRoutes")
const ticketRoutes = require("./routes/ticketRoutes")
const subscriptionRoutes = require("./routes/subscriptionRoutes")
const causeRoutes = require("./routes/causeRoutes")
const eventRoutes = require("./routes/eventRoutes")
const galleryRoutes = require("./routes/galleryRoutes")
const teamRoutes = require("./routes/teamRoutes")

dotenv.config({ path: path.join(__dirname, '.env') })
connectDB()

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 60 * 60 * 24 * 7,
        autoRemove: 'native',
        touchAfter: 24 * 3600
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static("public"));

app.use(async (req, res, next) => {
    try {
        const settings = await Settings.findOne({ key: 'main' }).lean();
        res.locals.settings = settings || {};
    } catch (error) {
        console.error('Failed to load settings:', error);
        res.locals.settings = {};
    }
    next();
});

app.use(async (req, res, next) => {
    if (!req.session?.userId) {
        res.locals.unreadTicketsCount = 0;
        return next();
    }

    try {
        const unreadCount = await Ticket.countDocuments({
            $or: [{ isRead: false }, { isRead: { $exists: false } }],
        });
        res.locals.unreadTicketsCount = unreadCount || 0;
    } catch (error) {
        console.error('Failed to load unread tickets count:', error);
        res.locals.unreadTicketsCount = 0;
    }
    next();
});

app.engine(
    "hbs",
    exphbs.engine({
        extname: ".hbs",
        defaultLayout: "main",
        layoutsDir: path.join(__dirname, "views", "layouts"),
        partialsDir: path.join(__dirname, "views", "partials"),
        helpers: hbsHelpers,
    })
)
app.set("view engine", "hbs")
app.set("views", "./views")

app.use('/tabler', express.static(path.join(__dirname, 'node_modules', '@tabler', 'core', 'dist')));
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(authRoutes);
app.use(homeRoutes);
app.use(userRoutes);
app.use(contentRoutes);
app.use(blogRoutes);
app.use(settingsRoutes);
app.use(ticketRoutes);
app.use(subscriptionRoutes);
app.use(causeRoutes);
app.use(eventRoutes);
app.use(galleryRoutes);
app.use(teamRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`)
})
