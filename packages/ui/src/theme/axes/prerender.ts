import { PRESET_NAMES, presets } from "@theme/presets"
import { NEUTRALISED_WHEN_HIDDEN } from "@theme/theme-provider/neutralisedAxes"
import { AXES, AXIS_KEYS, type AxisKey } from "./registry"
import { presetAxisStorageKey } from "./settings"
import { TOKEN_CACHE_STORAGE_KEY, cacheInputKeys } from "./tokenCache"
import { KIT_VERSION } from "./version"

type Restorable = [
  storageKey: string,
  attribute: string,
  values: readonly string[],
]

/**
 * The inline script that runs before the app: it restores the resolved mode,
 * every attribute axis and the active preset's axes from storage, validating
 * each value, then applies the cached token set when its id matches. ES5 and
 * self-contained, because it runs before any bundle loads. Storage can throw
 * (sandboxed iframes, blocked site data), so the mode is resolved and set
 * before anything else touches it.
 */
export function buildPrerenderScript(): string {
  const attributes: Restorable[] = AXIS_KEYS.filter(
    (key) => key !== "mode" && AXES[key].attribute,
  ).map((key) => [
    AXES[key].storageKey,
    AXES[key].attribute as string,
    AXES[key].values,
  ])

  const neutralised: Record<string, string[]> = {}
  const presetAxes: Record<string, Restorable[]> = {}
  for (const name of PRESET_NAMES) {
    const preset = presets[name]
    neutralised[name] = (preset.hiddenCommonAxes ?? [])
      .filter((axis) => NEUTRALISED_WHEN_HIDDEN.includes(axis))
      .flatMap((axis) => AXES[axis as AxisKey]?.attribute ?? [])
    presetAxes[name] = Object.entries(
      preset.axes as Record<string, { values: readonly string[] }>,
    ).map(([axis, definition]) => [
      presetAxisStorageKey(name, axis),
      `data-${name}-${axis}`,
      definition.values,
    ])
  }

  const json = JSON.stringify
  return [
    ";(function(){var d=document.documentElement,s=null,m=null,r,i,v;",
    `try{s=window.localStorage;m=s.getItem(${json(AXES.mode.storageKey)})}catch(e){s=null}`,
    'if(m!=="light"&&m!=="dark")m="system";',
    "try{",
    'r=m==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;',
    'd.setAttribute("data-mode",r);',
    "if(!s)return;",
    `var A=${json(attributes)},N=${json(neutralised)},P=${json(presetAxes)},K=${json(cacheInputKeys())};`,
    `var p=s.getItem(${json(AXES.preset.storageKey)})||"",x=N[p]||[],q=P[p]||[];`,
    "for(i=0;i<A.length;i++){v=s.getItem(A[i][0]);if(v&&A[i][2].indexOf(v)!==-1&&x.indexOf(A[i][1])===-1)d.setAttribute(A[i][1],v)}",
    "for(i=0;i<q.length;i++){v=s.getItem(q[i][0]);if(v&&q[i][2].indexOf(v)!==-1)d.setAttribute(q[i][1],v)}",
    `var id=[${json(KIT_VERSION)},r];for(i=0;i<K.length;i++)id.push(s.getItem(K[i])||"");id=id.join("|");`,
    `var c=JSON.parse(s.getItem(${json(TOKEN_CACHE_STORAGE_KEY)})||"null");`,
    "if(c&&c.id===id&&c.tokens){for(var t in c.tokens)d.style.setProperty(t,c.tokens[t])}",
    "}catch(e){}})()",
  ].join("")
}
