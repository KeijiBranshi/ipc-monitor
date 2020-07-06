import createIpcRendererMonitor from "renderer/monitor-ipc-renderer";

const ipcRendererMonitor = createIpcRendererMonitor().share();

/** Export Constructors */
export { createIpcRendererMonitor };

/** Export standalone monitor */
export default ipcRendererMonitor;
