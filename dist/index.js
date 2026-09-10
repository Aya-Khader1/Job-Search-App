"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_controller_1 = require("./app.controller");
(0, app_controller_1.bootsrap)().catch((error) => {
    console.log(`Faild to start application`, error);
    process.exit(1);
});
