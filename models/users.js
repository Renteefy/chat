const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    any: {},
  },
  { strict: false }
);

module.exports = mongoose.model("User", userSchema);
