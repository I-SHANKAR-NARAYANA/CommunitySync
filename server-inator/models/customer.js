const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    profilePicture: String,
    homeAdress: { type: String, required: true },
    communityId: { type: String, required: true },
    // communityId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Community',
    //     required: true
    // }
  },
  { collection: "Customers" }
);

const customerModel = mongoose.model("Customer", customerSchema);
module.exports = customerModel;