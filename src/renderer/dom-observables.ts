import { WebviewTag } from "electron";
import { Observable } from "rxjs/Observable";
import { from } from "rxjs/observable/from";
import { Observer } from "rxjs/Observer";

const windowReady = new Promise((resolve) => {
  const loadedHandler = () => {
    resolve();
    window.removeEventListener("load", loadedHandler);
  };
  if (document.readyState === "complete") {
    resolve();
  } else {
    window.addEventListener("load", loadedHandler);
  }
});

export function onDomMutations(
  target: Node = document.documentElement,
  config: MutationObserverInit = { subtree: true, childList: true }
): Observable<MutationRecord> {
  return Observable.create((observer: Observer<MutationRecord>) => {
    const mutation = new MutationObserver((mutationRecords) =>
      mutationRecords.map((m) => observer.next(m))
    );
    mutation.observe(target, config);
    return function unsubscribe() {
      mutation.disconnect();
    };
  });
}

function extractWebviewElements(nodes: NodeList): WebviewTag[] {
  return [...nodes.values()]
    .filter((node) => node instanceof HTMLElement && node.tagName === "WEBVIEW")
    .map((node) => node as WebviewTag);
}

export default function onWebviews(): Observable<WebviewTag> {
  const webviewsFromDom = () => {
    const preExistingWebviews = extractWebviewElements(
      document.querySelectorAll("webview")
    );
    return onDomMutations()
      .mergeMap((mutation) => extractWebviewElements(mutation.addedNodes))
      .startWith(...preExistingWebviews);
  };

  return from(windowReady).switchMap(() => webviewsFromDom());
}
