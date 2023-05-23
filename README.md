# graceful-sd

A library to help with shutting down servers gracefully.

This library wraps [stoppable](https://github.com/hunterloftis/stoppable) and takes care of listening for SIGINT and SIGTERM events. After getting a shutdown event, the library calls the registered server and calls the stop function.

### Future state

It would be nice to handle closing database connections, flushing logs, etc.

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