import { bootsrap } from "./app.controller";

bootsrap().catch((error) => {
  console.log(`Faild to start application`, error);
  process.exit(1);
});
