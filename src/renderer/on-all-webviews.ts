import { WebviewTag } from "electron";
import { Observable } from "rxjs/Observable";
import { from } from "rxjs/observable/from";
import { _throw as throwError } from "rxjs/observable/throw";
import { Observer } from "rxjs/Observer";

import "rxjs/add/operator/filter";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/switchMap";

export function onDomMutations(
  target: Node = document?.documentElement,
  config: MutationObserverInit = { subtree: true, childList: true }
): Observable<MutationRecord> {
  if (!target) {
    return throwError(
      new Error("DOM Mutations Observable: Node DOM Target Provided")
    );
  }

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

const whenDomReady: Observable<void> = from(
  new Promise((resolve, reject) => {
    const isUndefined = (obj: any) =>
      typeof obj === "undefined" || obj === undefined || obj === null;
    if (isUndefined(window) || isUndefined(document)) {
      reject(new Error("Global Window/DOM not present"));
      return;
    }

    if (document?.readyState === "complete") {
      resolve();
    } else {
      const loadedHandler = () => {
        resolve();
        window.removeEventListener("load", loadedHandler);
      };
      window.addEventListener("load", loadedHandler);
    }
  })
);

function filterToWebviewElements(nodes: NodeList): WebviewTag[] {
  return [...nodes.values()]
    .filter((node) => node instanceof HTMLElement && node.tagName === "WEBVIEW")
    .map((node) => node as WebviewTag);
}

/**
 * Returns an Observable that emits [`WebviewTag`](https://www.electronjs.org/docs/api/webview-tag?q=WebviewTag#webview-tag)s for every `<webview/>` html element that
 * gets added to the DOM tree.
 */
export default function onAllWebviews(): Observable<WebviewTag> {
  return whenDomReady.switchMap(() => {
    const selectedNodes = document.querySelectorAll("webview");
    const existingWebviewElements = filterToWebviewElements(selectedNodes);

    const newWebviewElements = onDomMutations()
      .filter((mutation) => mutation?.addedNodes !== undefined)
      .mergeMap((mutation) => filterToWebviewElements(mutation.addedNodes));
    return newWebviewElements.startWith(...existingWebviewElements);
  });
}
