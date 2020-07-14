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

const whenDomReady: Observable<unknown> = from(
  new Promise((resolve, reject) => {
    if (!(window || document)) {
      reject(new Error("Global Window/DOM not present"));
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

function extractWebviewElements(nodes: NodeList): WebviewTag[] {
  return [...nodes.values()]
    .filter((node) => node instanceof HTMLElement && node.tagName === "WEBVIEW")
    .map((node) => node as WebviewTag);
}

export default function onWebviews(): Observable<WebviewTag> {
  return whenDomReady.switchMap(() => {
    const preExistingWebviews = extractWebviewElements(
      document.querySelectorAll("webview")
    );
    return onDomMutations()
      .filter((mutation) => mutation?.addedNodes !== undefined)
      .mergeMap((mutation) => extractWebviewElements(mutation.addedNodes))
      .startWith(...preExistingWebviews);
  });
}
