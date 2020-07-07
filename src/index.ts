import mainProcessMonitor from "./main";
import ipcRendererMonitor from "./renderer";

const ipcMonitor =
  process?.type === "renderer" ? ipcRendererMonitor : mainProcessMonitor;

export { IpcMark, IpcMonitor } from "./common/types";
export default ipcMonitor;
