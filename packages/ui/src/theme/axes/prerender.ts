import { STYLES, STYLE_NAMES } from "@theme/styles"
import type { ThemeConfig } from "@theme/themeConfig"
import {
  LEGACY_MARKER_KEY,
  LEGACY_REVISION,
  LEGACY_RULES,
  LEGACY_TARGETS,
} from "./legacy"
import {
  AXES,
  AXIS_KEYS,
  isAxisValue,
  type AxisKey,
  type AxisValues,
} from "./registry"
import {
  TOKEN_CACHE_SCHEMA,
  TOKEN_CACHE_STORAGE_KEY,
  cacheInputKeys,
  defaultsHash,
} from "./tokenCache"
import { KIT_VERSION } from "./version"

type Restorable = [
  storageKey: string,
  attribute: string,
  values: readonly string[],
  /** Painted when no valid value is stored, keyed by style name. */
  fallback: Record<string, string>,
]

// The config's value when it is one of the axis's values, else the
// registry's; resolveDefaults gives the provider the same.
function configDefault(
  given: Readonly<Record<string, unknown>>,
  key: AxisKey,
): string {
  const value = given[key]
  return isAxisValue(key, value) ? value : AXES[key].default
}

/**
 * The inline script that runs before the app. It migrates legacy storage as
 * `migrateStorage` does, then stamps the mode and every attribute axis as the
 * provider resolves them: mode, then style, from the stored value, else the
 * config default, else the registry default; every other axis from the stored
 * value, else the style's default, else the config default, else the registry
 * default. It applies the cached token set when its id matches. ES5 and
 * self-contained, because it runs before any bundle loads. Storage can throw
 * (sandboxed iframes, blocked site data), so the mode is resolved and set
 * before anything else touches it, and blocked storage reads as empty.
 *
 * `defaults` must be the `defaults` the app passes ThemeProvider. A value that
 * is not one of its axis's values is ignored, as the provider ignores it.
 */
export function buildPrerenderScript(
  defaults: ThemeConfig["defaults"] = {},
): string {
  const given: Readonly<Record<string, unknown>> = defaults
  const attributes: Restorable[] = AXIS_KEYS.filter(
    (key) => key !== "mode" && key !== "style" && AXES[key].attribute,
  ).map((key) => {
    const fallback: Record<string, string> = {}
    for (const name of STYLE_NAMES) {
      const own: Partial<Record<AxisKey, string>> = STYLES[name].defaults
      fallback[name] = own[key] ?? configDefault(given, key)
    }
    return [
      AXES[key].storageKey,
      AXES[key].attribute as string,
      AXES[key].values,
      fallback,
    ]
  })

  const configDefaults = Object.fromEntries(
    AXIS_KEYS.map((key) => [key, configDefault(given, key)]),
  ) as AxisValues

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
    ";(function(){var d=document.documentElement,s=null,m=null,r,i,v,p,o={},f=0,",
    "h=function(a,b){return Object.prototype.hasOwnProperty.call(a,b)},",
    // o memoises every value read or written, f records a read or write that
    // threw. Without storage every read is absent, so each axis falls back.
    "g=function(a){var y=null;if(!s)return null;if(!h(o,a)){try{y=s.getItem(a)}catch(e){f=1}o[a]=y}return o[a]};",
    `try{s=window.localStorage;m=s.getItem(${json(AXES.mode.storageKey)})}catch(e){s=null}`,
    `if(${json(AXES.mode.values)}.indexOf(m)===-1)m=${json(configDefault(given, "mode"))};`,
    "try{",
    'r=m==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;',
    'd.setAttribute("data-mode",r);',
    // runLegacyTable in ES5; w holds the keys changed in first-change order.
    `if(s){var L=${json(storageRules)},T=${json(LEGACY_TARGETS)},w=[],j,k,R,W,H,G,`,
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
    `if(!f&&n<${LEGACY_REVISION})try{s.setItem(${json(LEGACY_MARKER_KEY)},${json(String(LEGACY_REVISION))})}catch(e){}}`,
    // The style picks every other axis's fallback, so it resolves first.
    `p=g(${json(AXES.style.storageKey)});if(${json(AXES.style.values)}.indexOf(p)===-1)p=${json(configDefault(given, "style"))};`,
    `d.setAttribute(${json(AXES.style.attribute)},p);`,
    `var A=${json(attributes)};`,
    "for(i=0;i<A.length;i++){v=g(A[i][0]);if(A[i][2].indexOf(v)===-1)v=A[i][3][p];d.setAttribute(A[i][1],v)}",
    // tokenCacheId's form: kit version, schema, resolved mode, raw values,
    // the defaults hash.
    `if(s){var K=${json(cacheInputKeys())},id=[${json(KIT_VERSION)},${json(String(TOKEN_CACHE_SCHEMA))},r],c;`,
    `for(i=0;i<K.length;i++)id.push(g(K[i])||"");id.push(${json(defaultsHash(configDefaults))});id=id.join("|");`,
    `c=JSON.parse(s.getItem(${json(TOKEN_CACHE_STORAGE_KEY)})||"null");`,
    "if(c&&c.id===id&&c.tokens){for(var t in c.tokens)d.style.setProperty(t,c.tokens[t])}}",
    "}catch(e){}})()",
  ].join("")
}
