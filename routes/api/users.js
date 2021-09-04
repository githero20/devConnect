const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const normalize = require("normalize-url");

//bring in user model
const User = require("../../models/User");

//@route    POST api/users
//@desc     Register user
//@access   Public

router.post(
  "/",
  check("name", "Name is required").notEmpty(),
  check("email", "Please input a valid email").isEmail(),
  check(
    "password",
    "Please input a password with 6 or more characters"
  ).isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.arrray() });
      //add return before every res.status unless it's the last one
    }

    const { name, email, password } = req.body;

    try {
      //1. See If user exists
      let user = await User.findOne({ email });
      //same as email: email
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }
      //doing this so we get the same kind of error whether an input error or the user is already there

      //2. Get users gravatar
      const avatar = gravatar.url(email, {
        s: "200", //size
        r: "pg", //rating
        d: "mm", //default image icon
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });
      //this doesn't save but just calls the user, we have to call user.save to save it to the database

      //3. Encrypt password
      const salt = await bcrypt.genSalt(10);
      //10 - recommended no of rounds
      user.password = await bcrypt.hash(password, salt);

      await user.save();
      //this now saves the user

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
        //require config for the token above
        { expiresIn: "5 days" },
        // in production this should be 3600
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
