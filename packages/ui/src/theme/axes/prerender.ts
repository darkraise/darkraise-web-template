import type { ThemeConfig } from "@theme/themeConfig"
import { resolveRegistry, type ThemeRegistry } from "../config/registry"
import {
  STAMPED_SIGNATURES,
  signatureAttribute,
  type SignatureMap,
} from "../config/signatures"
import {
  LEGACY_MARKER_KEY,
  LEGACY_REVISION,
  LEGACY_RULES,
  LEGACY_TARGETS,
} from "./legacy"
import { AXES, AXIS_KEYS, type AxisKey, type AxisValues } from "./registry"
import {
  BUILTIN_STYLES_HASH,
  TOKEN_CACHE_SCHEMA,
  TOKEN_CACHE_STORAGE_KEY,
  cacheInputKeys,
  defaultsHash,
} from "./tokenCache"
import { KIT_VERSION } from "./version"

type Restorable = [
  storageKey: string,
  attribute: string,
  axis: AxisKey,
  values: readonly string[],
  /** Painted when the user, the preset and the style leave the axis unset. */
  fallback: string,
]

/**
 * The defaults resolveDefaults gives the provider, without its warnings: the
 * config's value when the registry accepts it, else the axis default, and the
 * preset only when it belongs to the default style.
 */
function configDefaults(
  given: Readonly<Record<string, unknown>>,
  registry: ThemeRegistry,
): AxisValues {
  const out = {} as Record<AxisKey, string>
  for (const key of AXIS_KEYS) {
    const value = given[key]
    out[key] = registry.isValue(key, value) ? value : AXES[key].default
  }
  out.preset = registry.presetFor(
    out.style,
    typeof given.preset === "string" ? given.preset : undefined,
  )
  return out as AxisValues
}

/**
 * The inline script that runs before the app. It migrates legacy storage as
 * `migrateStorage` does, then stamps the mode and every attribute axis as the
 * provider resolves them: the mode; the style, stored or else the config
 * default; the preset, stored or else the config default, either only when it
 * belongs to that style, else `base`; every other axis from the stored value,
 * else the preset's value, else the style's default, else the config default;
 * then every signature, from the preset, else the style. The built-in and
 * the config's styles and presets travel as a table of each style's defaults
 * and signatures and each preset's style, axis values and signatures. It
 * applies the cached token set when its id matches. ES5 and self-contained,
 * because it runs before any bundle loads. Storage can throw (sandboxed
 * iframes, blocked site data), so the mode is resolved and set before
 * anything else touches it, and blocked storage reads as empty.
 *
 * `config` must hold the `defaults`, `styles` and `presets` the app passes
 * ThemeProvider. A value the registry does not accept is ignored, as the
 * provider ignores it, and so is a definition with errors.
 */
export function buildPrerenderScript(
  config?: Pick<ThemeConfig, "defaults" | "styles" | "presets">,
): string {
  const registry = resolveRegistry(config)
  const defaults = configDefaults(config?.defaults ?? {}, registry)
  // A style's signatures are complete (kit defaults filled in); a preset's
  // hold only what it sets.
  const styles: Record<
    string,
    [Partial<Record<AxisKey, string>>, Record<string, string>]
  > = {}
  for (const [name, style] of Object.entries(registry.styles)) {
    const signatures = registry.signaturesFor(name, "base")
    styles[name] = [
      { ...style.defaults },
      Object.fromEntries(
        STAMPED_SIGNATURES.map((key) => [key, signatures[key]]),
      ),
    ]
  }
  const presets: Record<
    string,
    [string, Partial<Record<AxisKey, string>>, SignatureMap]
  > = {}
  for (const [name, preset] of Object.entries(registry.presets)) {
    const own: SignatureMap = {}
    for (const key of STAMPED_SIGNATURES) {
      const value = preset.signatures[key]
      if (value !== undefined) Object.assign(own, { [key]: value })
    }
    presets[name] = [preset.style, { ...preset.axes }, own]
  }
  const stamped = STAMPED_SIGNATURES.map((key) => [
    key,
    signatureAttribute(key),
  ])
  const attributes: Restorable[] = AXIS_KEYS.filter(
    (key) =>
      key !== "mode" &&
      key !== "style" &&
      key !== "preset" &&
      AXES[key].attribute,
  ).map((key) => [
    AXES[key].storageKey,
    AXES[key].attribute as string,
    key,
    registry.values(key),
    defaults[key],
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
    ";(function(){var d=document.documentElement,s=null,m=null,r,i,v,p,o={},f=0,",
    "h=function(a,b){return Object.prototype.hasOwnProperty.call(a,b)},",
    // o memoises every value read or written, f records a read or write that
    // threw. Without storage every read is absent, so each axis falls back.
    "g=function(a){var y=null;if(!s)return null;if(!h(o,a)){try{y=s.getItem(a)}catch(e){f=1}o[a]=y}return o[a]};",
    `try{s=window.localStorage;m=s.getItem(${json(AXES.mode.storageKey)})}catch(e){s=null}`,
    `if(${json(AXES.mode.values)}.indexOf(m)===-1)m=${json(defaults.mode)};`,
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
    // S maps each style to [defaults, signatures], P each preset to
    // [style, axes, signatures], G lists [signature, attribute].
    `var S=${json(styles)},P=${json(presets)},A=${json(attributes)},G=${json(stamped)},q,b,Q,Y,Z;`,
    // The style picks the preset and every other axis's fallback, so it
    // resolves first; a preset of another style counts as unset.
    `p=g(${json(AXES.style.storageKey)});if(p===null||!h(S,p))p=${json(defaults.style)};`,
    `d.setAttribute(${json(AXES.style.attribute)},p);`,
    'b=function(x){return x==="base"||x!==null&&h(P,x)&&P[x][0]===p};',
    `q=g(${json(AXES.preset.storageKey)});if(!b(q))q=b(${json(defaults.preset)})?${json(defaults.preset)}:"base";`,
    `d.setAttribute(${json(AXES.preset.attribute)},q);`,
    'Q=q==="base"?{}:P[q][1];Z=q==="base"?{}:P[q][2];Y=S[p][0];',
    "for(i=0;i<A.length;i++){v=g(A[i][0]);if(A[i][3].indexOf(v)===-1)v=h(Q,A[i][2])?Q[A[i][2]]:h(Y,A[i][2])?Y[A[i][2]]:A[i][4];d.setAttribute(A[i][1],v)}",
    "for(i=0;i<G.length;i++)d.setAttribute(G[i][1],h(Z,G[i][0])?Z[G[i][0]]:S[p][1][G[i][0]]);",
    // tokenCacheId's form: kit version, schema, resolved mode, the built-in
    // definitions hash, raw values, the defaults hash, the definitions hash.
    `if(s){var K=${json(cacheInputKeys())},id=[${json(KIT_VERSION)},${json(String(TOKEN_CACHE_SCHEMA))},r,${json(BUILTIN_STYLES_HASH)}],c;`,
    `for(i=0;i<K.length;i++)id.push(g(K[i])||"");id.push(${json(defaultsHash(defaults))},${json(registry.hash)});id=id.join("|");`,
    `c=JSON.parse(s.getItem(${json(TOKEN_CACHE_STORAGE_KEY)})||"null");`,
    "if(c&&c.id===id&&c.tokens){for(var t in c.tokens)d.style.setProperty(t,c.tokens[t])}}",
    "}catch(e){}})()",
  ].join("")
}
