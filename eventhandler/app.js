const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const useragent = require("express-useragent");
//const path = require("path");
//const env = require("dotenv").config();

// set up express
let app = express();

/*
//adminpro
const admin = require("./controller/admin.js");
app.use("/admin", admin);
*/


app.use(useragent.express());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

/*
// session management
const session = require("express-session");
const sessionSecret = env.parsed.SESSION_SECRET ? env.parsed.SESSION_SECRET : "streamback-xyz-8989";
const sessionOptions = {
	secret: sessionSecret,
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({ mongooseConnection: mongoose.connection })
};
app.use(session(sessionOptions)); // session secret
*/

/*
// auth setup
const flash = require("connect-flash");
const passport = require("passport");
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
*/

app.use(express.static("./public"));


/*
// fileuploads
const fileUpload = require("express-fileupload");
app.use(fileUpload({ createParentPath: true }));
*/

const router = require("./router");
app.use(router);

module.exports = app;
