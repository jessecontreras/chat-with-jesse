/**
 * @file Server entry point.
 * Boots the Fastify GraphQL app created by `createApp()` and starts listening.
 */

import "dotenv/config";
import { createApp } from "./schema/graphql";

const PORT = Number(process.env.PORT || 3000);

/**
 * Start the GraphQL server.
 *
 * @remarks
 * - Keep this file minimal so tests can import and boot the app in isolation.
 */
createApp()
  .then((app) => app.listen({ port: PORT, host: "0.0.0.0" }))
  .then(() => {
    console.log(`GraphQL ready at http://localhost:${PORT}/graphiql`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
