import * as http from 'http';
import stoppable from 'stoppable';

/**
 * Class to help with shutting down servers and other node processes gracefully.
 *
 * This class should be used as a singleton so the registered server and/or
 * callbacks are shutdown/called in the correct order.
 */
export class GracefulShutdown {
  private static _instance: GracefulShutdown;
  private stoppableServer: (http.Server & stoppable.WithStop) | undefined;
  private afterShutdownCallbacks: {(): void}[];

  private constructor() {
    this.init();
    this.afterShutdownCallbacks = [];
  }

  /**
   * The singleton instance of GracefulShutdown.
   */
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

  /**
   * Registers a server so it will be stopped when a shutdown
   * event is passed to the node process.
   * @param server the server to stop when the node process needs to end
   */
  registerServer(server: http.Server) {
    this.stoppableServer = stoppable(server);
    console.log(
      'Server registered with GracefulShutdown ',
      new Date().toISOString()
    );
  }

  /**
   * Registers callbacks that will be called during a process shutdown event.
   *
   * The callbacks are called in parallel. They will be called after the registered
   * server (if one is registered) is stopped, or immediately if a server hasn't
   * been registered.
   * @param callback the function to call during a node process shutdown event
   */
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
