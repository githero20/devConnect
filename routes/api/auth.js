const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const auth = require("../../middleware/auth"); //auth is redundant here
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

//@route    GET api/auth
//@desc     Test route
//@access   Public

router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error.");
  }
});

//@route    POST api/auth
//@desc     Authenticate user & get token
//@access   Public

router.post(
  "/",
  check("email", "Please input a valid email").isEmail(),
  check("password", "Password is required").exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.arrray() });
      //add return before every res.status unless it's the last one, why?
    }

    const { email, password } = req.body;

    try {
      //1. See If user exists
      let user = await User.findOne({ email });
      //same as email: email
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }
      //doing this so we get the same kind of error whether an input error or the user is already there

      const isMatch = await bcrypt.compare(password, user.password);
      // bcrypt compare - compares the plain password input and the encrypted one in the database to see if they are the same.

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      //4. Return jsonwebtoken
      //return the jsonwebtoken so in the front end when a user registers they get logged in immediately
      const payload = {
        user: {
          id: user.id,
          //with mongodb it'll be ._id, but mongoose uses an abstraction so .id
        },
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
