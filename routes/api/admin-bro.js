const AdminBro = require('admin-bro');
const AdminBroExpress = require('@admin-bro/express');

const adminBro = new AdminBro({
    databases: [],
    rootPath: '/api/admin',
});

const router = AdminBroExpress.buildRouter(adminBro);
module.exports = {router, adminBro};
