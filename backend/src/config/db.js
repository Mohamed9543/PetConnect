const dns = require("dns");
const mongoose = require("mongoose");

// Some Windows/router DNS resolvers refuse SRV lookups (querySrv ECONNREFUSED),
// which breaks mongodb+srv:// URIs. Fall back to a public resolver in that case.
async function connectWithSrvFallback(uri) {
  try {
    await mongoose.connect(uri);
  } catch (error) {
    if (error.code === "ECONNREFUSED" && error.syscall === "querySrv") {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      await mongoose.connect(uri);
    } else {
      throw error;
    }
  }
}

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/petconnect";
  await connectWithSrvFallback(uri);
  console.log("MongoDB connected");
}

module.exports = connectDB;
