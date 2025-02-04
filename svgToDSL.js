const fs = require("fs");
const xml2js = require("xml2js");
const { optimize } = require("svgo");

// SVGO configuration remains similar to your existing config.
const svgoConfig = {
  plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'cleanupAttrs',
    'mergeStyles',
    'inlineStyles',
    'minifyStyles',
    'cleanupIds',
    'removeUselessDefs',
    'cleanupNumericValues',
    'convertColors',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'removeViewBox',
    'cleanupEnableBackground',
    'removeHiddenElems',
    'removeEmptyText',
    'convertShapeToPath',
    'convertEllipseToCircle',
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    'convertPathData',
    'convertTransform',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'mergePaths',
    'removeUnusedNS',
    'sortDefsChildren',
    'removeTitle',
    'removeDesc'
  ]
};

const TAGS = [
  "g",
  "polygon",
  "path",
  "circle",
  "defs",
  "linearGradient",
  "stop",
  "rect",
  "polyline",
  "text",
  "tspan",
  "mask",
  "use",
  "ellipse",
  "radialGradient",
  "filter",
  "feColorMatrix",
  "feComposite",
  "feGaussianBlur",
  "feMorphology",
  "feOffset",
  "pattern",
  "feMergeNode",
  "feMerge",
  "animate",
  "INVALIDTAG"
];

// Updated ATTRIBUTES array:
// - Added new attributes (primitiveUnits, baseFrequency, numOctaves, seed, mode,
//   xChannelSelector, yChannelSelector, and data-name) before the "INVALIDATTRIBUTE" marker.
const ATTRIBUTES = [
  "xmlns",
  "viewBox",
  "d",
  "points",
  "transform",
  "cx",
  "cy",
  "r",
  "stroke",
  "stroke-width",
  "fill",
  "fill-opacity",
  "translate",
  "rotate",
  "scale",
  "x1",
  "y1",
  "x2",
  "y2",
  "stop-color",
  "offset",
  "stop-opacity",
  "width",
  "height",
  "x",
  "y",
  "font-size",
  "letter-spacing",
  "style",         // For wings trait.
  "opacity",
  "id",
  "xlink:href",
  "rx",
  "ry",
  "mask",
  "fx",
  "fy",
  "gradientTransform",
  "filter",
  "filterUnits",
  "result",
  "in",
  "in2",
  "type",
  "values",        // Only one occurrence.
  "operator",
  "k1",
  "k2",
  "k3",
  "k4",
  "stdDeviation",
  "edgeMode",
  "radius",
  "fill-rule",
  "dx",
  "dy",
  "attributeName",
  "dur",
  "repeatCount",
  "data-name",     // <-- Added to handle attributes like in eyes1.svg and teeth1.svg.
  // New attributes for filter and effects:
  "primitiveUnits",
  "baseFrequency",
  "numOctaves",
  "seed",
  "mode",
  "xChannelSelector",
  "yChannelSelector",
  "INVALIDATTRIBUTE"
];

const BASIC_COLORS = {
  "black": [0, 0, 0],
  "white": [255, 255, 255],
  "red": [255, 0, 0],
  "green": [0, 255, 0],
  "blue": [0, 0, 255]
};

let DSL_LINES = [];

// Returns the index of the tag in TAGS array (or the index of "INVALIDTAG")
function getTagIndex(tagName) {
  let idx = TAGS.indexOf(tagName);
  return idx < 0 ? TAGS.indexOf("INVALIDTAG") : idx;
}

// Returns the index of the attribute in ATTRIBUTES array (or the index of "INVALIDATTRIBUTE")
function getAttrIndex(attrName) {
  let idx = ATTRIBUTES.indexOf(attrName);
  return idx < 0 ? ATTRIBUTES.indexOf("INVALIDATTRIBUTE") : idx;
}

// Push a two-byte line onto DSL_LINES
function pushLine(a, b) {
  DSL_LINES.push([a & 0xff, b & 0xff]);
}

// Encodes a start tag using a marker (0x80 + 0x40 + tag index)
function encodeStartTag(tagIdx) {
  pushLine(0x80 + 0x40 + tagIdx, 0x00);
}

// Encodes an end tag using a marker (0x80 + tag index)
function encodeEndTag(tagIdx) {
  pushLine(0x80 + tagIdx, 0x00);
}

// Encodes all attributes for a node.
// Skips the 'xmlns' attribute since it’s not needed in the DSL.
function encodeAttributes(nodeName, nodeAttrs) {
  for (let [attrName, attrVal] of Object.entries(nodeAttrs)) {
    if (attrName === "xmlns") continue; // Skip the namespace attribute.
    const val = Array.isArray(attrVal) ? attrVal[0] : attrVal;
    const idx = getAttrIndex(attrName);
    if (idx === ATTRIBUTES.length - 1) {
      console.warn(`Skipping unknown attribute '${attrName}' on <${nodeName}>`);
      continue;
    }
    pushLine(idx, 0);
    encodeAttributeValue(attrName, val);
  }
}

// Encodes an attribute value based on its type.
// Handles numbers, percentages, hex colors, rgb() formats, basic named colors,
// and falls back to encoding as a string.
// Special handling is added for "baseFrequency" which may contain two values.
function encodeAttributeValue(attrName, rawValue) {
  // Special handling for baseFrequency: may contain two values separated by whitespace.
  if (attrName === "baseFrequency" && rawValue.trim().includes(" ")) {
    let parts = rawValue.trim().split(/\s+/);
    for (let part of parts) {
      encodeAttributeValue(attrName, part);
    }
    return;
  }
  
  // Numeric fraction (e.g., ".5") - scales by 1000 for precision.
  if (/^[0]?\.\d+$/.test(rawValue)) {
    const floatVal = Math.round(parseFloat(rawValue) * 1000);
    pushLine(floatVal & 0xff, 0x10);
  }
  // Percentages (e.g., "50%") - uses marker 0x40.
  else if (/^\d+(\.\d+)?%$/.test(rawValue)) {
    const numVal = parseFloat(rawValue);
    pushLine(numVal & 0xff, 0x40);
  }
  // Plain numbers (integer or decimal):
  // - Decimals here are scaled by 10 (if a decimal point exists).
  // - Integers are encoded as a 12-bit value (8 bits + 4 bits).
  else if (/^\d+(\.\d+)?$/.test(rawValue)) {
    if (rawValue.includes(".")) {
      let floatVal = Math.round(parseFloat(rawValue) * 10);
      pushLine(floatVal & 0xff, 0x10);
    } else {
      let intVal = parseInt(rawValue, 10);
      pushLine(intVal & 0xff, (intVal >> 8) & 0x0f);
    }
  }
  // Hex colors (e.g., "#AABBCC")
  else if (/^#[0-9A-Fa-f]{6}$/.test(rawValue)) {
    let r = parseInt(rawValue.substring(1, 3), 16);
    let g = parseInt(rawValue.substring(3, 5), 16);
    let b = parseInt(rawValue.substring(5, 7), 16);
    pushLine(r, 0x00);
    pushLine(g, b);
  }
  // rgb() colors (e.g., "rgb(255, 0, 0)")
  else if (/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.test(rawValue)) {
    const rgb = rawValue.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
    pushLine(parseInt(rgb[1], 10), 0x00);
    pushLine(parseInt(rgb[2], 10), parseInt(rgb[3], 10));
  }
  // Basic named colors (e.g., "red", "blue")
  else if (BASIC_COLORS[rawValue]) {
    const [r, g, b] = BASIC_COLORS[rawValue];
    pushLine(r, 0x00);
    pushLine(g, b);
  }
  // url() references (e.g., "url(#a)") – extract the id and encode it as a string.
  else if (/^url\(\s*#([\w-]+)\s*\)$/.test(rawValue)) {
    const match = rawValue.match(/^url\(\s*#([\w-]+)\s*\)$/);
    const refId = match[1];
    encodeStringValue(refId);
  }
  // Fallback: encode any other value as a string.
  else {
    encodeStringValue(rawValue);
  }
}

// Encodes a string by first writing its length with a marker (0x20)
// then encoding each character’s ASCII code. (Adjust as needed for UTF-8.)
function encodeStringValue(str) {
  pushLine(str.length, 0x20);
  for (let i = 0; i < str.length; i++) {
    pushLine(str.charCodeAt(i), 0x00);
  }
}

// Encodes an entire node (its start tag, attributes, child nodes, and end tag).
function encodeNode(nodeName, nodeAttrs, children) {
  const tIdx = getTagIndex(nodeName);
  encodeStartTag(tIdx);
  encodeAttributes(nodeName, nodeAttrs);
  for (let child of children) {
    encodeNode(child.name, child.attrs, child.children);
  }
  encodeEndTag(tIdx);
}

// Flattens the XML structure into an object with node name, attributes, and children.
function flattenXML(obj, tagName = "svg") {
  let nodeAttrs = obj.$ || {};
  let children = [];
  for (let [subTag, subVal] of Object.entries(obj)) {
    if (subTag === "$" || subTag === "_") continue;
    if (Array.isArray(subVal)) {
      subVal.forEach((childObj) => {
        children.push(flattenXML(childObj, subTag));
      });
    }
  }
  return { name: tagName, attrs: nodeAttrs, children };
}

// Process a single SVG file: optimize, parse, encode, and return DSL hex string.
async function processSvgFile(filePath) {
  console.log(`Processing: ${filePath}`);
  const rawSvg = fs.readFileSync(filePath, "utf8");
  const optimizedSvg = optimize(rawSvg, svgoConfig);
  if (optimizedSvg.error) {
    throw new Error(`SVGO optimization failed for ${filePath}: ${optimizedSvg.error}`);
  }
  const result = await xml2js.parseStringPromise(optimizedSvg.data);
  const rootKey = Object.keys(result)[0];
  const rootNode = flattenXML(result[rootKey], rootKey);
  DSL_LINES = [];  // Clear previous output.
  encodeNode(rootNode.name, rootNode.attrs, rootNode.children);
  const hexLines = DSL_LINES.map(([a, b]) => {
    return (a < 16 ? "0" : "") + a.toString(16) + (b < 16 ? "0" : "") + b.toString(16);
  });
  return hexLines.join(" ");
}

// Helper to process multiple SVG files for a trait.
async function processTraitFiles(filePaths) {
  let traitDSL = "";
  for (const filePath of filePaths) {
    const dslHex = await processSvgFile(filePath);
    traitDSL += dslHex + " ";
  }
  return traitDSL.trim();
}

module.exports = { processSvgFile, processTraitFiles };

// Main function to process each trait based on configuration.
(async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node svgToDSL.js traits.json");
    process.exit(1);
  }

  const configFile = process.argv[2];
  const traitConfig = JSON.parse(fs.readFileSync(configFile, "utf8"));

  // Process each trait and write the DSL hex output to its corresponding file.
  for (const [trait, filePaths] of Object.entries(traitConfig)) {
    let traitDSL = "";
    for (const filePath of filePaths) {
      try {
        const dslHex = await processSvgFile(filePath);
        traitDSL += dslHex + " ";
      } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
        process.exit(1);
      }
    }
    fs.writeFileSync(`output_${trait}.txt`, traitDSL.trim(), "utf8");
    console.log(`Trait '${trait}' processed. DSL hex written to output_${trait}.txt`);
  }
})();