import * as http from 'http';
import {pino} from 'pino';
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
  private logger;

  private constructor() {
    this.logger = this.createLogger();
    this.init();
    this.afterShutdownCallbacks = [];
  }

  /**
   * The singleton instance of GracefulShutdown.
   */
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  private createLogger() {
    const logger = pino({
      level:
        process.env.GRACEFUL_SHUTDOWN_LOG_LEVEL ||
        process.env.PINO_LOG_LEVEL ||
        'info',
    }).child({
      module: 'GracefulShutdown',
    });
    return logger;
  }

  private init() {
    process.once('SIGINT', () => {
      this.logger.info('Got SIGINT event. Starting shutdown...');
      this.shutdown('SIGINT');
    });

    process.once('SIGTERM', () => {
      this.logger.info('Got SIGTERM event. Starting shutdown...');
      this.shutdown('SIGTERM');
    });
  }

  private async shutdown(signal: string) {
    this.shutdownServer();
    await this.callAfterServerShutdownCallbacks();
    this.logger.info('Shutdown complete.');

    // kill the process after a timeout
    // this gives the log messages time to flush
    // this isn't a great answer, but there is an issue up currently...
    // https://github.com/pinojs/pino/issues/1705
    setTimeout(() => {
      process.kill(process.pid, signal);
    }, 100);
  }

  private shutdownServer() {
    if (this.stoppableServer) {
      this.logger.info('Starting server shutdown...');
      this.stoppableServer.stop();
      this.logger.info('Server shutdown complete.');
    }
  }

  /**
   * Registers a server so it will be stopped when a shutdown
   * event is passed to the node process.
   * @param server the server to stop when the node process needs to end
   */
  registerServer(server: http.Server) {
    this.stoppableServer = stoppable(server);
    this.logger.info('Server registered.');
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
      this.logger.info('Starting to call after server shutdown callbacks...');
      await Promise.all(
        this.afterShutdownCallbacks.map((callback) => callback())
      );
      this.logger.info('After server shutdown callbacks complete.');
    }
  }
}
