const AdminBro = require("admin-bro");
const AdminBroExpress = require("@admin-bro/express");
const AdminBroMongoose = require("@admin-bro/mongoose");
const connectDB = require("./../../config/db");
const user = require("./users");

AdminBro.registerAdapter(AdminBroMongoose);

const AdminBroOptions = {
  resources: [user],
};

const adminBro = new AdminBro({
  databases: [],
  rootPath: "/api/admin",
  AdminBroOptions,
});

const router = AdminBroExpress.buildRouter(adminBro);
module.exports = { router, adminBro };
