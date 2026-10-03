import {
  LEGACY_MARKER_KEY,
  LEGACY_REVISION,
  LEGACY_RULES,
  LEGACY_TARGETS,
} from "./legacy"
import { AXES, AXIS_KEYS } from "./registry"
import {
  TOKEN_CACHE_SCHEMA,
  TOKEN_CACHE_STORAGE_KEY,
  cacheInputKeys,
} from "./tokenCache"
import { KIT_VERSION } from "./version"

type Restorable = [
  storageKey: string,
  attribute: string,
  values: readonly string[],
]

/**
 * The inline script that runs before the app. It migrates legacy storage as
 * `migrateStorage` does, then restores the resolved mode and every attribute
 * axis from the migrated values, validating each, and
 * applies the cached token set when its id matches. ES5 and self-contained,
 * because it runs before any bundle loads. Storage can throw (sandboxed
 * iframes, blocked site data), so the mode is resolved and set before anything
 * else touches it.
 */
export function buildPrerenderScript(): string {
  const attributes: Restorable[] = AXIS_KEYS.filter(
    (key) => key !== "mode" && AXES[key].attribute,
  ).map((key) => [
    AXES[key].storageKey,
    AXES[key].attribute as string,
    AXES[key].values,
  ])

  const storageRules = LEGACY_RULES.map((rule) => ({
    ...rule,
    when: rule.when.map((condition) => {
      const copy = { ...condition }
      delete copy.field
      return copy
    }),
  }))

  const json = JSON.stringify
  return [
    ";(function(){var d=document.documentElement,s=null,m=null,r,i,v;",
    `try{s=window.localStorage;m=s.getItem(${json(AXES.mode.storageKey)})}catch(e){s=null}`,
    'if(m!=="light"&&m!=="dark")m="system";',
    "try{",
    'r=m==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;',
    'd.setAttribute("data-mode",r);',
    "if(!s)return;",
    // runLegacyTable in ES5: o holds every value read or written, w the keys
    // changed in first-change order, f whether a read or write threw.
    `var L=${json(storageRules)},T=${json(LEGACY_TARGETS)},o={},w=[],f=0,j,k,R,W,H,G,`,
    "h=function(a,b){return Object.prototype.hasOwnProperty.call(a,b)},",
    "g=function(a){var y=null;if(!h(o,a)){try{y=s.getItem(a)}catch(e){f=1}o[a]=y}return o[a]},",
    "u=function(a,b){if(g(a)!==b){o[a]=b;if(w.indexOf(a)===-1)w.push(a)}},",
    `n=parseInt(g(${json(LEGACY_MARKER_KEY)}),10)||0;`,
    "for(i=0;i<L.length;i++){R=L[i];W=R.when;H=[];if(R.since<=n)continue;",
    "for(j=0;j<W.length;j++){v=g(W[j].key);H.push(v);if(W[j].values?v===null||W[j].values.indexOf(v)===-1:W[j].except?v!==null&&W[j].except.indexOf(v)!==-1:v===null)break}",
    "if(j<W.length)continue;",
    'G=R.map?(typeof H[0]==="string"&&h(R.map,H[0])?R.map[H[0]]:h(R.map,"*")?R.map["*"]:null):R.set;',
    "if(G)for(k in G)if(h(G,k)&&(R.overwrite||(h(T,k)?T[k].indexOf(g(k))===-1:g(k)===null)))u(k,G[k]);",
    "if(R.remove)for(j=0;j<R.remove.length;j++)u(R.remove[j],null)}",
    "for(i=0;i<w.length&&!f;i++)if(o[w[i]]!==null)try{s.setItem(w[i],o[w[i]])}catch(e){f=1}",
    "if(!f)for(i=0;i<w.length;i++)if(o[w[i]]===null)try{s.removeItem(w[i])}catch(e){f=1}",
    `if(!f&&n<${LEGACY_REVISION})try{s.setItem(${json(LEGACY_MARKER_KEY)},${json(String(LEGACY_REVISION))})}catch(e){}`,
    `var A=${json(attributes)},K=${json(cacheInputKeys())};`,
    "for(i=0;i<A.length;i++){v=g(A[i][0]);if(v&&A[i][2].indexOf(v)!==-1)d.setAttribute(A[i][1],v)}",
    `var id=[${json(KIT_VERSION)},${json(String(TOKEN_CACHE_SCHEMA))},r];for(i=0;i<K.length;i++)id.push(g(K[i])||"");id=id.join("|");`,
    `var c=JSON.parse(s.getItem(${json(TOKEN_CACHE_STORAGE_KEY)})||"null");`,
    "if(c&&c.id===id&&c.tokens){for(var t in c.tokens)d.style.setProperty(t,c.tokens[t])}",
    "}catch(e){}})()",
  ].join("")
}
