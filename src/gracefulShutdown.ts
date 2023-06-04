import * as http from 'http';
import stoppable from 'stoppable';

export class GracefulShutdown {
  private static _instance: GracefulShutdown;
  private stoppableServer: (http.Server & stoppable.WithStop) | undefined;
  private afterShutdownCallbacks: {(): void}[];

  private constructor() {
    this.init();
    this.afterShutdownCallbacks = [];
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

  private async shutdown(signal: string) {
    this.shutdownServer();
    await this.callAfterServerShutdownCallbacks();
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

  registerAfterServerShutdownCallback(callback: () => void) {
    this.afterShutdownCallbacks.push(callback);
  }

  private async callAfterServerShutdownCallbacks() {
    if (this.afterShutdownCallbacks.length > 0) {
      console.log(
        'Calling after server shutdown callbacks ',
        new Date().toISOString()
      );
      await Promise.all(
        this.afterShutdownCallbacks.map((callback) => callback())
      );
      console.log(
        'Finished calling after server shutdown callbacks ',
        new Date().toISOString()
      );
    }
  }
}
