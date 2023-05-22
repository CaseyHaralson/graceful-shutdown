import * as http from 'http';
import stoppable from 'stoppable';

export class GracefulShutdown {
  private static _instance: GracefulShutdown;
  private stoppableServer: (http.Server & stoppable.WithStop) | undefined;

  private constructor() {
    this.init();
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  private init() {
    process.once('SIGINT', () => {
      console.log(
        'Got SIGINT event. Starting graceful shutdown ',
        new Date().toISOString()
      );
      this.shutdown('SIGINT');
    });

    process.once('SIGTERM', () => {
      console.log(
        'Got SIGTERM event. Starting graceful shutdown ',
        new Date().toISOString()
      );
      this.shutdown('SIGTERM');
    });
  }

  private shutdown(signal: string) {
    // probably want to wrap the server in npm project "stoppable"
    // so it will handle any server connections
    // then
    // call server.close() or server.stop()
    // and close any database connections
    // etc
    // Note: you might need to extend the host timeout if we aren't
    // getting the "Graceful shutdown" log message
    this.shutdownServer();
    console.log('Graceful shutdown ', new Date().toISOString());
    process.kill(process.pid, signal);
  }

  private shutdownServer() {
    if (this.stoppableServer) {
      console.log('Starting to shutdown server ', new Date().toISOString());
      this.stoppableServer.stop();
      console.log('Server shutdown ', new Date().toISOString());
    }
  }

  registerServer(server: http.Server) {
    this.stoppableServer = stoppable(server);
    console.log(
      'Server registered with GracefulShutdown ',
      new Date().toISOString()
    );
  }
}
