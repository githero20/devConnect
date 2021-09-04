import axios from "axios";

const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["x-auth-token"] = token;
  } else {
    delete axios.defaults.headers.common["x-auth-token"];
    // we do this so we send a token with every request and don't have to pick and choose requests
    localStorage.removeItem("token");
  }
};

export default setAuthToken;
