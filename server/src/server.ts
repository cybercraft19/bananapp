import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.SERVER_PORT, () => {
  console.log(`BanaSync API escuchando en http://localhost:${env.SERVER_PORT}`);
});
