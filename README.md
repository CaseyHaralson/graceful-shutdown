# graceful-sd

A library to help with shutting down servers and other node processes gracefully.

This library wraps [stoppable](https://github.com/hunterloftis/stoppable) and takes care of listening for SIGINT and SIGTERM events. After getting a shutdown event, the library calls the registered server (if one has been registered) and calls the stop function.

The library also calls registered callbacks after the server is shutdown, or immediately if a server hasn't been registered. The callbacks are called in parallel and will be awaited before the node process is stopped.

## Usage

Install:

```
npm install graceful-sd
```

Create a server and pass it to the library:

```
import express from "express";
import { GracefulShutdown } from 'graceful-sd';

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const server = app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
GracefulShutdown.Instance.registerServer(server);
```

If a "Graceful shutdown [timestamp]" log message isn't seen at the end of shutdown, then the host service is probably timing out and forcing the process to stop. The host service timeout should be lengthened for adequate stopping time.

### After Server Shutdown Callbacks

Callbacks can be registered and will be run in parallel after the server is shutdown:

```
import { GracefulShutdown } from 'graceful-sd';

const databaseConnection = CreateDatabaseConnectionSomehow();
GracefulShutdown.Instance.registerAfterServerShutdownCallback(async () => {
  await databaseConnection.destroy();
})

// use the database connection to do database things
```