const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  //remember that middleware functions can take in next, i.e. move on to the next middleware function and ignore the rest
  //Get token from header
  const token = req.header("x-auth-token");

  //Check if not token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization failed." });
  }

  //Verify token
  try {
    jwt.verify(token, config.get("jwtSecret"), (error, decoded) => {
      if (error) {
        return res.status(401).json({ msg: "Token is not valid" });
      } else {
        req.user = decoded.user;
        next();
      }
    });
    //the above will decode the token
  } catch (err) {
    console.error("something is wrong with the auth middleware");
    res.status(500).json({ msg: "Server Error" });
  }
};
