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
 * UPDATED: Encodes a string value using a 16‐bit length.
 * The first token carries the high byte along with the marker,
 * then a second token holds the low byte.
 */
function encodeStringValue(str, isStyle = false) {
  if (!str) return;
  const marker = isStyle ? 0x21 : 0x20;
  const len = str.length;
  pushLine((len >> 8) & 0xff, marker); // high byte with marker
  pushLine(len & 0xff, 0x00);            // low byte (no marker)
  for (let i = 0; i < len; i++) {
    pushLine(str.charCodeAt(i), 0x00);
  }
}

function encodeAttributeValue(attrName, rawValue) {
  if (!rawValue) return;
  const val = rawValue.toString().trim();

  // Special attribute handling
  switch(attrName) {
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

  // Handle numeric values
  if (/^-?\d*\.?\d+$/.test(val)) {
    const num = parseFloat(val);
    const scaled = Math.round(num * 100);
    pushLine(scaled & 0xff, (scaled >> 8) & 0xff);
    return;
  }

  // Handle percentages
  if (/^-?\d*\.?\d+%$/.test(val)) {
    const num = parseFloat(val);
    pushLine(Math.round(num), 0x40);
    return;
  }

  // Handle colors
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    const r = parseInt(val.slice(1, 3), 16);
    const g = parseInt(val.slice(3, 5), 16);
    const b = parseInt(val.slice(5, 7), 16);
    pushLine(r, 0x00);
    pushLine(g, b);
    return;
  }

  // Handle urls
  const urlMatch = val.match(/^url\(#([^)]+)\)$/);
  if (urlMatch) {
    encodeStringValue(urlMatch[1], false);
    return;
  }

  // Default to string
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
    // Special handling for style tag content
    const styleContent = nodeAttrs._ || '';
    const len = styleContent.length;
    pushLine((len >> 8) & 0xff, 0x21);
    pushLine(len & 0xff, 0x00);
    for (let i = 0; i < len; i++) {
      pushLine(styleContent.charCodeAt(i), 0x00);
    }
  } else {
    // Handle all other attributes normally
    encodeAttributes(nodeName, nodeAttrs);
  }

  // Process children
  for (const child of children) {
    encodeNode(child.name, child.attrs, child.children);
  }

  encodeEndTag(tIdx);
}

function flattenXML(obj, tagName = "svg") {
  const nodeAttrs = { ...obj.$ } || {};
  const children = [];

  // Special handling for style tags - preserve the text content
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

async function processSvgFile(filePath) {
  console.log(`Processing: ${filePath}`);
  const rawSvg = fs.readFileSync(filePath, "utf8");

  // Preserve all SVG features during optimization
  const optimizedSvg = optimize(rawSvg, svgoConfig);
  if (optimizedSvg.error) {
    throw new Error(`SVGO optimization failed: ${optimizedSvg.error}`);
  }

  // Parse and process the SVG
  const result = await xml2js.parseStringPromise(optimizedSvg.data);
  const rootKey = Object.keys(result)[0];
  const rootNode = flattenXML(result[rootKey], rootKey);

  // Generate the DSL hex
  DSL_LINES = [];
  encodeNode(rootNode.name, rootNode.attrs, rootNode.children);

  const hexLines = DSL_LINES.map(([a, b]) => {
    return (a < 16 ? "0" : "") + a.toString(16) + (b < 16 ? "0" : "") + b.toString(16);
  });

  return hexLines.join("");
}

async function processTraitFiles(filePaths) {
  let traitDSL = "";
  for (const filePath of filePaths) {
    const dslHex = await processSvgFile(filePath);
    traitDSL += dslHex;
  }
  return traitDSL;
}

module.exports = { processSvgFile, processTraitFiles };

// Main CLI execution
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
        let traitDSL = "";
        for (const filePath of filePaths) {
          const dslHex = await processSvgFile(filePath);
          traitDSL += dslHex;
        }
        fs.writeFileSync(`output_${trait}.txt`, traitDSL, "utf8");
        console.log(`Trait '${trait}' processed and written to output_${trait}.txt`);
      }
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  })();
}
