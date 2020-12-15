const express = require("express");
const router = express.Router();


const janusevh = require("./controller/janusevh");

//router.get("/api/user", user.current);
router.post("/api/janus/event", janusevh.postEvent);
//router.post("/api/signup", user.signup);
//router.get("/api/signout", user.signout);
//router.get("/api/send-verification", user.sendVerification);
//router.get("/api/verify-email", user.verifyEmail);


module.exports = router;
