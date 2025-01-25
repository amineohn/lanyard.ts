import colors from "ansi-colors";

export class Logger {
  private static formatMessage(level: string, message: string): string {
    const timestamp = new Date()
      .toISOString()
      .split("T")
      .join(" ")
      .slice(0, -5);
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  }

  static info(message: string) {
    console.log(colors.blue(this.formatMessage("info", message)));
  }

  static warn(message: string) {
    console.warn(colors.yellow(this.formatMessage("warn", message)));
  }

  static error(message: string) {
    console.error(colors.red(this.formatMessage("error", message)));
  }

  static success(message: string) {
    console.log(colors.green(this.formatMessage("success", message)));
  }

  static debug(message: string) {
    console.debug(colors.gray(this.formatMessage("debug", message)));
  }
}
