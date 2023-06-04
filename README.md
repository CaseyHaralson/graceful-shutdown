# graceful-sd

A library to help with shutting down servers gracefully.

This library wraps [stoppable](https://github.com/hunterloftis/stoppable) and takes care of listening for SIGINT and SIGTERM events. After getting a shutdown event, the library calls the registered server and calls the stop function.

The library also calls registered callbacks after the server is shutdown.

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

If you aren't seeing a "Graceful shutdown [timestamp]" log message at the end of shutdown, then the host service is probably timing out and forcing the process to stop. The host service timeout should be lengthened for adequate stopping time.

### After Server Shutdown Callbacks

You can register callbacks to be run in parallel after the server is shutdown:

```
import { GracefulShutdown } from 'graceful-sd';

const databaseConnection = CreateDatabaseConnectionSomehow();
GracefulShutdown.Instance.registerAfterServerShutdownCallback(async () => {
  await databaseConnection.destroy();
})

// use the database connection to do database things
```