import mainProcessMonitor from "./main";
import ipcRendererMonitor from "./renderer";

const ipcMonitor =
  process.type === "renderer" ? ipcRendererMonitor : mainProcessMonitor;

export * from "common/metrics";
export default ipcMonitor;
