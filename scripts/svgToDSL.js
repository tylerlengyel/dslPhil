const fs = require("fs");
const xml2js = require("xml2js");
const { optimize } = require("svgo");

// SVGO config that preserves all gradient and style attributes
const svgoConfig = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          inlineStyles: false,
          cleanupIds: false,
          removeUselessDefs: false,
          removeEmptyAttrs: false,
          removeUnknownsAndDefaults: false,
          convertShapeToPath: false,
          convertTransform: false,
          removeComments: false,
          removeDesc: false,
          removeMetadata: false,
          removeHiddenElems: false,
          removeEmptyText: false,
          removeEmptyContainers: false,
          cleanupEnableBackground: false,
          minifyStyles: false,
          moveElemsAttrsToGroup: false,
          moveGroupAttrsToElems: false,
          collapseGroups: false
        }
      }
    },
    {
      name: 'removeStyleElement',
      active: false
    },
    {
      name: 'removeDimensions',
      active: false
    }
  ],
  multipass: false
};

const TAGS = [
  "svg",
  "defs",
  "style",
  "radialGradient",
  "linearGradient",
  "stop",
  "circle",
  "ellipse",
  "rect",
  "path",
  "g",
  "use",
  "symbol",
  "filter",
  "feGaussianBlur",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "clipPath",
  "mask",
  "pattern",
  "marker",
  "text",
  "tspan",
  "textPath",
  "INVALIDTAG"
];

const ATTRIBUTES = [
  // Core SVG attributes
  "id",
  "xmlns",
  "xmlns:xlink",
  "viewBox",
  "width",
  "height",
  "x",
  "y",
  "data-name",
  "class",
  "style",

  // Presentation attributes
  "fill",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "fill-opacity",
  "opacity",
  "fill-rule",

  // Gradient specific
  "gradientUnits",
  "gradientTransform",
  "spreadMethod",
  "cx",
  "cy",
  "fx",
  "fy",
  "r",
  "x1",
  "y1",
  "x2",
  "y2",

  // Stop specific
  "offset",
  "stop-color",
  "stop-opacity",

  // Filter specific
  "filterUnits",
  "primitiveUnits",
  "result",
  "in",
  "in2",
  "type",
  "baseFrequency",
  "numOctaves",
  "seed",
  "scale",
  "mode",
  "xChannelSelector",
  "yChannelSelector",
  "operator",
  "stdDeviation",
  "edgeMode",
  "values",

  // Path specific
  "d",
  "points",
  "transform",

  // Additional attributes
  "xlink:href",
  "clip-path",
  "mask",
  "filter",
  "preserveAspectRatio",

  // Must be last
  "INVALIDATTRIBUTE"
];

let DSL_LINES = [];

function pushLine(a, b) {
  DSL_LINES.push([a & 0xff, b & 0xff]);
}

function getTagIndex(tagName) {
  const idx = TAGS.indexOf(tagName);
  return idx < 0 ? TAGS.indexOf("INVALIDTAG") : idx;
}

function getAttrIndex(attrName) {
  const idx = ATTRIBUTES.indexOf(attrName);
  return idx < 0 ? ATTRIBUTES.indexOf("INVALIDATTRIBUTE") : idx;
}

/**
 * Encodes a string value using a 16‐bit length.
 * The first token carries the high byte along with the marker,
 * then a second token holds the low byte.
 */
function encodeStringValue(str, isStyle = false) {
  if (!str) return;
  const marker = isStyle ? 0x21 : 0x20;
  const len = str.length;
  pushLine((len >> 8) & 0xff, marker); // high byte with marker
  pushLine(len & 0xff, 0x00);         // low byte
  for (let i = 0; i < len; i++) {
    pushLine(str.charCodeAt(i), 0x00);
  }
}

/**
 * Updated color parser:
 *  1) #RRGGBB
 *  2) rgb(R,G,B)
 */
function encodeColor(val) {
  // #RRGGBB
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    const r = parseInt(val.slice(1, 3), 16);
    const g = parseInt(val.slice(3, 5), 16);
    const b = parseInt(val.slice(5, 7), 16);
    pushLine(r, 0x00);
    pushLine(g, b);
    return true;
  }
  // rgb( R, G, B )
  const rgbMatch = val.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    pushLine(r, 0x00);
    pushLine(g, b);
    return true;
  }
  return false;
}

function encodeAttributeValue(attrName, rawValue) {
  if (!rawValue) return;
  const val = rawValue.toString().trim();

  switch (attrName) {
    case 'stop-opacity':
    case 'fill-opacity':
    case 'stroke-opacity':
    case 'opacity': {
      const opacity = parseFloat(val);
      pushLine(Math.round(opacity * 255), 0x30);
      return;
    }
    case 'gradientTransform':
    case 'transform':
    case 'style':
    case 'class': {
      encodeStringValue(val, attrName === 'style');
      return;
    }
  }

  // numeric?
  if (/^-?\d*\.?\d+$/.test(val)) {
    const num = parseFloat(val);
    const scaled = Math.round(num * 100);
    pushLine(scaled & 0xff, (scaled >> 8) & 0xff);
    return;
  }

  // percentage
  if (/^-?\d*\.?\d+%$/.test(val)) {
    const num = parseFloat(val);
    pushLine(Math.round(num), 0x40);
    return;
  }

  // color
  if (attrName === 'fill' || attrName === 'stroke' || attrName === 'stop-color') {
    if (encodeColor(val)) return;
  }

  // #RRGGBB would also be caught above, but if not, check fallback url
  const urlMatch = val.match(/^url\(#([^)]+)\)$/);
  if (urlMatch) {
    encodeStringValue(urlMatch[1], false);
    return;
  }

  // fallback: plain string
  encodeStringValue(val);
}

function encodeAttributes(nodeName, nodeAttrs) {
  for (const [attrName, attrVal] of Object.entries(nodeAttrs)) {
    const val = Array.isArray(attrVal) ? attrVal[0] : attrVal;
    if (val === undefined || val === null) continue;

    const idx = getAttrIndex(attrName);
    pushLine(idx, 0x00);
    encodeAttributeValue(attrName, val);
  }
}

function encodeStartTag(tagIdx) {
  pushLine(0x80 + 0x40 + tagIdx, 0x00);
}

function encodeEndTag(tagIdx) {
  pushLine(0x80 + tagIdx, 0x00);
}

function encodeNode(nodeName, nodeAttrs, children) {
  const tIdx = getTagIndex(nodeName);
  encodeStartTag(tIdx);

  if (nodeName === 'style') {
    // style node text content
    const styleContent = nodeAttrs._ || '';
    const len = styleContent.length;
    pushLine((len >> 8) & 0xff, 0x21);
    pushLine(len & 0xff, 0x00);
    for (let i = 0; i < len; i++) {
      pushLine(styleContent.charCodeAt(i), 0x00);
    }
  } else {
    encodeAttributes(nodeName, nodeAttrs);
  }

  for (const child of children) {
    encodeNode(child.name, child.attrs, child.children);
  }

  encodeEndTag(tIdx);
}

function flattenXML(obj, tagName = "svg") {
  const nodeAttrs = { ...obj.$ } || {};
  const children = [];

  if (tagName === 'style' && obj._) {
    nodeAttrs._ = obj._;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$' || key === '_') continue;
    if (Array.isArray(value)) {
      value.forEach(child => {
        children.push(flattenXML(child, key));
      });
    }
  }

  return { name: tagName, attrs: nodeAttrs, children };
}

async function parseAndFlatten(filePath) {
  console.log(`Processing: ${filePath}`);
  const rawSvg = fs.readFileSync(filePath, "utf8");

  // Optimize with SVGO
  const optimizedSvg = optimize(rawSvg, svgoConfig);
  if (optimizedSvg.error) {
    throw new Error(`SVGO optimization failed: ${optimizedSvg.error}`);
  }

  // Parse and flatten
  const result = await xml2js.parseStringPromise(optimizedSvg.data);
  const rootKey = Object.keys(result)[0];
  const rootNode = flattenXML(result[rootKey], rootKey);
  return rootNode;
}

/**
 * Merges multiple flattened <svg> roots into one final <svg>.
 * Instead of forcibly setting 420×420, we use the FIRST root's
 * width/height/viewBox (so placement is less likely to shift).
 */
async function processTraitFiles(filePaths) {
  const roots = [];
  for (const fp of filePaths) {
    const root = await parseAndFlatten(fp);
    roots.push(root);
  }

  // Start with the first root's <svg> as the base
  const mergedRoot = {
    name: "svg",
    attrs: { ...roots[0].attrs }, // copy the first <svg>'s attributes
    children: []
  };

  // Ensure we have at least "xmlns" etc
  if (!mergedRoot.attrs.xmlns) {
    mergedRoot.attrs.xmlns = "http://www.w3.org/2000/svg";
  }
  if (!mergedRoot.attrs["xmlns:xlink"]) {
    mergedRoot.attrs["xmlns:xlink"] = "http://www.w3.org/1999/xlink";
  }

  // Create one <defs> at top
  const mergedDefs = { name: "defs", attrs: {}, children: [] };
  mergedRoot.children.push(mergedDefs);

  // For each root, push their <defs> children into mergedDefs
  // and wrap the rest in <g> so each file is separate
  roots.forEach((r, i) => {
    const maybeDefs = r.children.find(c => c.name === "defs");
    if (maybeDefs) {
      mergedDefs.children.push(...maybeDefs.children);
    }

    const gNode = {
      name: "g",
      attrs: { id: `file${i + 1}` },
      children: []
    };

    // everything else except <defs>
    r.children.forEach(child => {
      if (child.name !== 'defs') {
        gNode.children.push(child);
      }
    });

    mergedRoot.children.push(gNode);
  });

  DSL_LINES = [];
  encodeNode(mergedRoot.name, mergedRoot.attrs, mergedRoot.children);

  const hexLines = DSL_LINES.map(([a, b]) => {
    return (a < 16 ? "0" : "") + a.toString(16) + (b < 16 ? "0" : "") + b.toString(16);
  });
  return hexLines.join("");
}

module.exports = { parseAndFlatten, processTraitFiles };

// CLI usage
if (require.main === module) {
  (async function main() {
    if (process.argv.length < 3) {
      console.log("Usage: node svgToDSL.js traits.json");
      process.exit(1);
    }

    try {
      const configFile = process.argv[2];
      const traitConfig = JSON.parse(fs.readFileSync(configFile, "utf8"));

      for (const [trait, filePaths] of Object.entries(traitConfig)) {
        const dslHex = await processTraitFiles(filePaths);
        fs.writeFileSync(`output_${trait}.txt`, dslHex, "utf8");
        console.log(`Trait '${trait}' processed and written to output_${trait}.txt`);
      }
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  })();
}