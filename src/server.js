const { MongoClient } = require("mongodb");
const express = require("express");

const app = express();
const port = 3000;

// Connection URI
const uri = "mongodb://localhost:27017";

// Create a new MongoClient
const client = new MongoClient(uri);
const db = client.db("visitor_management");
const blacklisted_visitors_collection = db.collection("blacklisted_visitors");
const visit_collection = db.collection("Visit");
const visitortype_collection = db.collection("VisitorType");
const identificationtype_collection = db.collection("IdentificationTypes");
const alllocations_collection = db.collection("ReceptionLocations");
//GetBlackListedUsers API

app.get("/visitor_management/getBlackListedUsers", async (req, res) => {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("connected to server successfully");

    // Query the collection and return the results
    const blacklistedVisitors = await blacklisted_visitors_collection
      .find({})
      .toArray();

    // Send the results as response
    res.json(blacklistedVisitors);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

//GetBlacklistedVisitor with email API

app.get(
  "/visitor_management/getBlackListedVisitor/:EmailID",
  async (req, res) => {
    try {
      const EmailID = req.params.EmailID; // Extract emailID from route parameters
      const blacklistedUser = await blacklisted_visitors_collection.findOne({
        EmailID: EmailID,
      });

      if (blacklistedUser) {
        res.status(200).json(blacklistedUser);
      } else {
        res
          .status(404)
          .json({ message: "User not found in blacklisted visitors list" });
      }
    } catch (error) {
      console.error("Error retrieving blacklisted visitor:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

//AddBlackListVisitor
const bodyParser = require("body-parser");

// Add body-parser middleware to parse JSON bodies
app.use(bodyParser.json());

app.post("/visitor_management/addBlackListVisitor", async (req, res) => {
  try {
    const { VisitorName, EmailID, PhoneNumber } = req.body;

    if (!VisitorName || !EmailID || !PhoneNumber) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await blacklisted_visitors_collection.insertOne({
      VisitorName: VisitorName,
      EmailID: EmailID,
      PhoneNumber: PhoneNumber,
    });

    res.status(200).json({ message: "Blacklisted visitor added successfully" });
  } catch (error) {
    console.error("Error creating blacklist visitor", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});
//GetVisitDetails
app.get("/visitor_management/getVisitDetails/", async (req, res) => {
  try {
    const VisitorID = req.body.VisitorID;
    const visitDetails = await visit_collection.findOne({
      VisitorID: VisitorID,
    });
    res.status(200).json(visitDetails);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

//AllLocations
app.get("/visitor_management/allLocations", async (req, res) => {
  try {
    const allLocations = await alllocations_collection.find({}).toArray();
    // Send the results as response
    res.json(allLocations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});
//AllVisitors
app.get("/visitor_management/filterVisits", async (req, res) => {
  try {
    // Extract query parameters from the request body
    const {
      selectedLocation,
      startDate,
      endDate,
      max,
      last,
      visitorName,
      statusPending,
      statusCheckedIn,
      statusCheckedOut,
      statusCancelled,
      selectedTenant,
    } = req.body;

    console.log(statusPending, visitorName);
    // Construct filter object based on provided query parameters
    const filter = {};
    if (selectedLocation) filter.selectedLocation = selectedLocation;
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;
    if (max) filter.max = max;
    if (last) filter.last = last;
    if (visitorName) filter.VisitorName = visitorName;
    if (statusPending) filter.Status = "Pending";
    if (statusCheckedIn) filter.Status = "CheckedIn";
    if (statusCheckedOut) filter.Status = "CheckedOut";
    if (statusCancelled) filter.Status = "Cancelled";
    if (selectedTenant) filter.selectedTenant = selectedTenant;
    console.log(filter);
    // Find visits matching the filter criteria
    const visitsCursor = visit_collection.find(filter);

    // Iterate over the cursor and collect the results
    const visits = [];
    await visitsCursor.forEach((visit) => {
      visits.push(visit);
    });

    console.log(visits);
    // Send the filtered visits as JSON response
    res.status(200).json(visits);
  } catch (error) {
    console.error("Error filtering visits", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

//getAllVisitorTypes

app.get("/visitor_management/getAllVisitorTypes", async (req, res) => {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("connected to server successfully");

    // Query the collection and return the results
    const visitorTypes = await visitortype_collection.find({}).toArray();

    // Send the results as response
    res.json(visitorTypes);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
//getAllIdentificationTypes

app.get("/visitor_management/getAllIdentificationTypes", async (req, res) => {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("connected to server successfully");

    // Query the collection and return the results
    const IdentificationTypes = await identificationtype_collection
      .find({})
      .toArray();

    // Send the results as response
    res.json(IdentificationTypes);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
//VisitorTypeChartInfo

app.get("/visitor_management/VisitorTypeChartInfo", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    console.log(startDate, endDate);

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    const visitorTypeCounts = await visit_collection
      .aggregate([
        {
          $match: {
            ExpectedCheckInTime: {
              $gte: startDateObj,
              $lte: endDateObj,
            },
          },
        },
        {
          $group: {
            _id: "$VisitorType",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    res.json(visitorTypeCounts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});
//checkInVisitor
app.patch("/visitor_management/CheckInVisitor", async (req, res) => {
  try {
    const VisitorID = req.body.VisitorID;

    // Update the status of the selected visitor
    const result = await visit_collection.updateOne(
      { VisitorID: VisitorID },
      { $set: { Status: "CheckedIn" } }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: "Visitor checked in successfully" });
    } else {
      res.status(404).json({ message: "Visitor not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

//CheckOutVisitor
app.patch("/visitor_management/CheckOutVisitor", async (req, res) => {
  try {
    const VisitorID = req.body.VisitorID;

    // Update the status of the selected visitor
    const result = await visit_collection.updateOne(
      { VisitorID: VisitorID },
      { $set: { Status: "CheckedOut" } }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: "Visitor checked out successfully" });
    } else {
      res.status(404).json({ message: "Visitor not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});
//CheckOutVisitor
app.patch("/visitor_management/CancelVisit", async (req, res) => {
  try {
    const { _id } = req.body;

    // Update the status of the selected visitor
    const result = await visit_collection.updateOne(
      { _id: ObjectId.createFromHexString(_id) },
      { $set: { Status: "Cancelled" } }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: "Visit cancelled successfully" });
    } else {
      res.status(404).json({ message: "Visitor not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});
//GetVisitorInfo
const { ObjectId } = require("mongodb");

app.get("/visitor_management/GetVisitorInfo", async (req, res) => {
  try {
    const { _id } = req.body;
    const visitorInfo = await visit_collection.findOne({
      _id: ObjectId.createFromHexString(_id),
    });
    if (visitorInfo) {
      res.status(200).json(visitorInfo);
    } else {
      res.status(404).json({ message: "Visitor not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});
//updateVisit
app.patch("/visitor_management/updateVisit", async (req, res) => {
  try {
    const {
      currentID,
      editVisitorName,
      visitorEmail,
      expectedCheckInTime,
      expectedCheckOutTime,
    } = req.body;
    const expectedCheckInTimeObj = new Date(expectedCheckInTime);
    const expectedCheckOutTimeObj = new Date(expectedCheckOutTime);
    const updateVisitor = await visit_collection.updateOne(
      {
        _id: ObjectId.createFromHexString(currentID),
      },
      {
        $set: {
          VisitorName: editVisitorName,
          EmailID: visitorEmail,
          ExpectedCheckInTime: expectedCheckInTimeObj,
          ExpectedCheckOutTime: expectedCheckOutTimeObj,
        },
      }
    );
    res.status(200).json({ message: "Visitor updated" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

//visitors per month

app.get("/visitor_management/visitorsPerMonth", async (req, res) => {
  const { startDate, endDate, timezone, tenant, Status } = req.body;
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  try {
    // Fetch visitors data from MongoDB
    const visitorsData = await visit_collection
      .find({
        ExpectedCheckInTime: { $gte: startDateObj, $lte: endDateObj },
        Status: Status, // Use dynamic Status value
      })
      .toArray();

    // Group data by month
    const groupedData = visitorsData.reduce((acc, curr) => {
      const month = curr.ExpectedCheckInTime.getMonth() + 1; // Months are zero-based in JavaScript
      acc[month] = acc[month] || [];
      acc[month].push(curr);
      return acc;
    }, {});

    // Format data to match the desired output
    const output = Object.keys(groupedData).map((month) => {
      return {
        month: month.padStart(2, "0"), // Zero-padding month if needed
        Status: Status,
        count: groupedData[month].length,
      };
    });
    // Sort the output by month
    output.sort((a, b) => {
      return a.month - b.month;
    });

    res.json({ [Status.toLowerCase()]: output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve data from database" });
  }
});
//visitors per day
app.get("/visitor_management/visitorsPerDay", async (req, res) => {
  const { startDate, endDate, timezone, tenant, Status } = req.body;
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  try {
    // Fetch visitors data from MongoDB
    const visitorsData = await visit_collection
      .find({
        ExpectedCheckInTime: { $gte: startDateObj, $lte: endDateObj },
        Status: Status, // Use dynamic Status value
      })
      .toArray();

    // Group data by week
    const groupedData = visitorsData.reduce((acc, curr) => {
      const dayOfWeek = curr.ExpectedCheckInTime.getDay(); // 0 (Sunday) through 6 (Saturday)
      acc[dayOfWeek] = acc[dayOfWeek] || [];
      acc[dayOfWeek].push(curr);
      return acc;
    }, {});

    // Format data to match the desired output
    const output = Object.keys(groupedData).map((dayOfWeek) => {
      return {
        count: groupedData[dayOfWeek].length,
        day: parseInt(dayOfWeek) === 0 ? 7 : parseInt(dayOfWeek), // Adjust Sunday (0) to 7
        Status: Status,
      };
    });
    // Sort the output by day
    output.sort((a, b) => {
      return a.day - b.day;
    });

    res.json({ [Status.toLowerCase()]: output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve data from database" });
  }
});
//visitorsPerHour
app.get("/visitor_management/visitorsPerHour", async (req, res) => {
  const { startDate, endDate, timezone, tenant, Status } = req.body;
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  try {
    // Fetch visitors data from MongoDB
    const visitorsData = await visit_collection
      .find({
        ExpectedCheckInTime: { $gte: startDateObj, $lte: endDateObj },
        Status: Status, // Use dynamic Status value
      })
      .toArray();

    // Group data by hour
    const groupedData = visitorsData.reduce((acc, curr) => {
      const hourOfDay = curr.ExpectedCheckInTime.getHours(); // 0 through 23
      acc[hourOfDay] = acc[hourOfDay] || [];
      acc[hourOfDay].push(curr);
      return acc;
    }, {});

    // Format data to match the desired output
    const output = Object.keys(groupedData).map((hourOfDay) => {
      return {
        count: groupedData[hourOfDay].length,
        hour: parseInt(hourOfDay), // Hour of the day (0-23)
        Status: Status,
      };
    });

    // Sort the output by hour
    output.sort((a, b) => {
      return a.hour - b.hour;
    });

    res.json({ [Status.toLowerCase()]: output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve data from database" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
