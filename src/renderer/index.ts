import { IpcMonitor } from "common/types";
import createIpcRendererMonitor from "renderer/monitor-ipc-renderer";

const ipcRendererMonitor: IpcMonitor = createIpcRendererMonitor().share();

/** Export Constructors */
export { createIpcRendererMonitor };

/** Export standalone monitor */
export default ipcRendererMonitor;
