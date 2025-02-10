const fs = require("fs");

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

const COLOR_ATTRIBUTES = new Set([
  "fill",
  "stroke",
  "stop-color"
]);

// Read the hex string
if (process.argv.length < 3) {
  console.log("Usage: node dsl_decoder.js <inputHexFile>");
  process.exit(1);
}

const hexString = fs.readFileSync(process.argv[2], "utf8")
  .trim()
  .replace(/[\n\r\s]+/g, "");

if (!/^[0-9A-Fa-f]+$/.test(hexString)) {
  console.error("Invalid hex string");
  process.exit(1);
}

// Convert hex to tokens
const tokens = [];
for (let i = 0; i < hexString.length; i += 4) {
  const a = parseInt(hexString.substr(i, 2), 16);
  const b = parseInt(hexString.substr(i + 2, 2), 16);
  tokens.push({ a, b });
}

let tokenIndex = 0;

function nextToken() {
  return tokens[tokenIndex++];
}

function peekToken() {
  return tokens[tokenIndex];
}

function decodeStringValue(isStyle = false) {
  const lenToken = nextToken();
  if (lenToken.b !== (isStyle ? 0x21 : 0x20)) {
    throw new Error(`Expected ${isStyle ? 'style' : 'string'} marker`);
  }
  
  let str = "";
  for (let i = 0; i < lenToken.a; i++) {
    const charToken = nextToken();
    str += String.fromCharCode(charToken.a);
  }
  return str;
}

function decodeNumericValue() {
  const t = nextToken();
  let val = (t.b << 8) | t.a;
  if (val & 0x8000) val -= 65536;
  return (val / 100).toString();
}

function decodeColor() {
  const first = nextToken();
  const second = nextToken();
  const r = first.a;
  const g = second.a;
  const b = second.b;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function decodeSingleAttributeValue(attrName) {
  const look = peekToken();
  if (!look) return "";

  // Handle marker-based values
  switch (look.b) {
    case 0x20: // Regular string
      return decodeStringValue();
    
    case 0x21: // Style content
      return decodeStringValue(true);
      
    case 0x30: { // Opacity
      const t = nextToken();
      return (t.a / 255).toString();
    }
    
    case 0x40: { // Percentage
      const t = nextToken();
      return t.a + "%";
    }
  }

  // Handle color attributes
  if (COLOR_ATTRIBUTES.has(attrName)) {
    return decodeColor();
  }

  // Handle special attributes
  if (attrName === "gradientTransform" || attrName === "style" || attrName === "class") {
    return decodeStringValue();
  }

  // Default to numeric
  return decodeNumericValue();
}

function decodeAttributeValue(attrName) {
  let value = decodeSingleAttributeValue(attrName);

  // Handle gradient references
  if (value && (attrName === 'fill' || attrName === 'stroke')) {
    if (!value.startsWith('#')) {
      value = `url(#${value})`;
    }
  }

  // Special formatting for certain attributes
  switch(attrName) {
    case 'gradientTransform':
      // Keep transform value as-is
      break;
    case 'style':
      // Handle style specially to preserve CSS syntax
      if (value.startsWith('url(#')) {
        value = `fill:${value}`;
      }
      break;
    case 'stop-opacity':
    case 'fill-opacity':
    case 'stroke-opacity':
    case 'opacity':
      // Format opacity values to reasonable precision
      value = parseFloat(value).toFixed(2);
      break;
  }

  return value;
}

function decodeNode() {
  if (tokenIndex >= tokens.length) return null;
  
  const tk = peekToken();
  if (!tk || tk.a < 0xC0) {
    throw new Error("Expected start tag token");
  }

  const startToken = nextToken();
  const tagIndex = startToken.a - 0xC0;
  const tagName = TAGS[tagIndex] || "INVALIDTAG";
  const node = { tag: tagName, attrs: {}, children: [] };

  // Handle attributes and special cases
  while (tokenIndex < tokens.length) {
    const look = peekToken();
    if (!look || look.a >= 0x80) break;

    if (tagName === 'style') {
      // Special handling for style content
      if (look.b === 0x21) {
        const styleContent = decodeStringValue(true);
        node.styleContent = styleContent;
        break;  // Style content is done
      }
    }

    const attrToken = nextToken();
    const attrName = ATTRIBUTES[attrToken.a] || "INVALIDATTRIBUTE";
    const val = decodeAttributeValue(attrName);
    
    if (val !== undefined && val !== null && val !== "") {
      node.attrs[attrName] = val;
    }
  }

  // Handle children
  while (tokenIndex < tokens.length) {
    const look = peekToken();
    if (!look) break;

    if (look.a >= 0x80 && look.a < 0xC0) {
      const endToken = nextToken();
      const endTagIndex = endToken.a - 0x80;
      if (endTagIndex !== tagIndex) {
        console.warn(`Warning: Mismatched tags`);
      }
      return node;
    }

    const child = decodeNode();
    if (child) {
      node.children.push(child);
    }
  }

  return node;
}

function buildXML(node) {
  if (!node) return "";

  let attrs = "";
  for (const [key, val] of Object.entries(node.attrs)) {
    if (val !== undefined && val !== null && val !== "") {
      attrs += ` ${key}="${val}"`;
    }
  }

  let inner = "";
  if (node.tag === 'style') {
    // Special handling for style tags
    inner = node.styleContent || "";
  } else {
    inner = node.children.map(buildXML).join("");
  }

  return `<${node.tag}${attrs}>${inner}</${node.tag}>`;
}

try {
  // Process the SVG
  tokenIndex = 0;
  const rootNode = decodeNode();
  
  if (!rootNode) {
    throw new Error("Failed to decode SVG structure");
  }

  // Force svg tag if needed
  if (rootNode.tag === "INVALIDTAG") {
    rootNode.tag = "svg";
  }

  // Ensure required namespaces
  if (!rootNode.attrs["xmlns"]) {
    rootNode.attrs["xmlns"] = "http://www.w3.org/2000/svg";
  }
  if (!rootNode.attrs["xmlns:xlink"]) {
    rootNode.attrs["xmlns:xlink"] = "http://www.w3.org/1999/xlink";
  }

  // Find defs section
  let defsNode = rootNode.children.find(child => child.tag === 'defs');
  if (defsNode) {
    // Ensure style element exists in defs
    let styleNode = defsNode.children.find(child => child.tag === 'style');
    if (!styleNode) {
      // Add style element if missing
      styleNode = {
        tag: 'style',
        attrs: {},
        styleContent: '\n      .cls-1 {\n        fill: url(#radial-gradient);\n      }\n    '
      };
      defsNode.children.unshift(styleNode);  // Add style as first child in defs
    }
  }

  // Add XML declaration
  const svgOutput = '<?xml version="1.0" encoding="UTF-8"?>\n' + buildXML(rootNode);
  console.log(svgOutput);
  
} catch (error) {
  console.error("Error decoding SVG:", error.message);
  process.exit(1);
}
