require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const mongoose = require("mongoose");
const customer = require("./models/customer");
const supplier = require("./models/supplier");
const service = require("./models/service");

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGODB_LOCAL_URL, {})
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("Error occured", err);
  });

app.post("/client/auth/register", async (req, res) => {
  try {
    const found = await customer.findOne({ email: req.body.email });
    if (found) {
      return res.json({ status: "Error", error: "Duplicate Email" });
    } else {
      const customerData = {};
      for (const key in req.body) {
        if (req.body.hasOwnProperty(key) && req.body[key]) {
          customerData[key] = req.body[key];
        }
      }
      customerData.password = await bcrypt.hash(req.body.password, 10);
      await customer.create(customerData);
      return res.json({
        status: "Success",
        message: "Customer created successfully",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ status: "Error", error: "Internal Server Error" });
  }
});

app.post("/user/auth/register", async (req, res) => {
  console.log("nkjdbkj");
  try {
    const found = await supplier.findOne({ email: req.body.email });
    if (found) {
      return res.json({ status: "Error", error: "Duplicate Email" });
    } else {
      const supplierData = {};
      for (const key in req.body) {
        if (req.body.hasOwnProperty(key) && req.body[key]) {
          supplierData[key] = req.body[key];
        }
      }
      supplierData.password = await bcrypt.hash(req.body.password, 10);
      await supplier.create(supplierData);
      return res.json({
        status: "Success",
        message: "Supplier created successfully",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ status: "Error", error: "Internal Server Error" });
  }
});

app.post("/auth/login", async (req, res) => {
  let user;
  user = await customer.findOne({ email: req.body.email });
  if (!user) {
    user = await supplier.findOne({ email: req.body.email });
  }
  if (!user) {
    return res.status(401).json({ message: "Invalid email" });
  }
  const isPasswordValid = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid password" });
  }
  const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, {
    expiresIn: "1h",
  });
  console.log(token);
  res.json({ token });
});

// app.get("/protected", verifyToken, (req, res) => {
//   res.json({ message: "Protected route accessed successfully" });
// });

function verifyToken(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "Token is required" });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.userId = decoded.userId;
    next();
  });
}

app.post("/service-request", verifyToken, async (req, res) => {
  try {
    const serviceData = {};
    for (const key in req.body) {
      if (req.body.hasOwnProperty(key) && req.body[key]) {
        serviceData[key] = req.body[key];
      }
    }
    serviceData.userId = req.userId;
    const newServiceRequest = await service.create(serviceData);
    await customer.findByIdAndUpdate(
      req.userId,
      { $push: { servicesInitiated: newServiceRequest._id } },
      { new: true }
    );
    const suppliers = await supplier.find({
      typeOfServicesOffered: serviceData.typeOfServiceNeeded,
    });
    await Promise.all(
      suppliers.map(async (supplier) => {
        supplier.services.push(newServiceRequest._id);
        await supplier.save();
      })
    );
    res.status(201).json({ message: "Service request created successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/service-requests", async (req, res) => {
  try {
    const serviceRequests = await service.find();

    const mappedServiceRequests = serviceRequests.map((serviceRequest) => {
      return {
        typeOfServiceNeeded: serviceRequest.typeOfServiceNeeded,
        descriptionOfServiceRequest: serviceRequest.descriptionOfServiceRequest,
        preferredDateAndTimeRange: serviceRequest.preferredDateAndTimeRange,
        budget: serviceRequest.budget,
        additionalNotesOrInstructions:
          serviceRequest.additionalNotesOrInstructions,
        preferredContactMethod: serviceRequest.preferredContactMethod,
        paymentInformation: serviceRequest.paymentInformation,
      };
    });

    res.status(200).json(mappedServiceRequests);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// app.get("/demo", (req, res) => {
//   console.log("Get requested received");
//   res.send("Demo");
// });

const port = process.env.PORT || 1337;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
