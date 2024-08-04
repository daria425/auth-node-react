const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const app = initializeApp({
  credential: applicationDefault(),
});

const auth = getAuth(app);
module.exports = {
  auth,
};
