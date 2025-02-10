const fs = require("fs");

/*
  ------------------------------------------------------------
  1) CONFIG: TAGS + ATTRIBUTES (unchanged from earlier)
  ------------------------------------------------------------
*/
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
  "fill-rule", // <--- ensures 'evenodd' etc. is preserved

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

const COLOR_ATTRIBUTES = new Set([
  "fill",
  "stroke",
  "stop-color"
]);

/*
  ------------------------------------------------------------
  2) TOKEN STREAM PARSING
  ------------------------------------------------------------
*/

function hexToTokens(hexString) {
  const cleanHex = hexString.trim().replace(/[\n\r\s]+/g, "");
  if (!/^[0-9A-Fa-f]+$/.test(cleanHex)) {
    throw new Error("Invalid hex string");
  }

  const tokens = [];
  for (let i = 0; i < cleanHex.length; i += 4) {
    const a = parseInt(cleanHex.substr(i, 2), 16);
    const b = parseInt(cleanHex.substr(i + 2, 2), 16);
    tokens.push({ a, b });
  }
  return tokens;
}

/*
  ------------------------------------------------------------
  3) DECODER LOGIC
  ------------------------------------------------------------
*/

function decodeRootNodeFromTokens(tokens) {
  let tokenIndex = 0;

  function nextToken() {
    return tokens[tokenIndex++];
  }

  function peekToken() {
    return tokens[tokenIndex];
  }

  function decodeStringValue(isStyle = false) {
    const highToken = nextToken();
    if (highToken.b !== (isStyle ? 0x21 : 0x20)) {
      throw new Error(`Expected ${isStyle ? 'style' : 'string'} marker`);
    }
    const lowToken = nextToken();
    const len = (highToken.a << 8) | lowToken.a;
    let str = "";
    for (let i = 0; i < len; i++) {
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

    switch (look.b) {
      case 0x20: // normal string
        return decodeStringValue();
      case 0x21: // style string
        return decodeStringValue(true);
      case 0x30: { // opacity
        const t = nextToken();
        return (t.a / 255).toString();
      }
      case 0x40: { // percentage
        const t = nextToken();
        return t.a + "%";
      }
    }

    if (COLOR_ATTRIBUTES.has(attrName)) {
      return decodeColor();
    }

    // default numeric
    return decodeNumericValue();
  }

  function decodeAttributeValue(attrName) {
    let value = decodeSingleAttributeValue(attrName);
    // If fill/stroke isn't a hex color, interpret as url(#id)
    if (value && (attrName === 'fill' || attrName === 'stroke')) {
      if (!value.startsWith('#')) {
        value = `url(#${value})`;
      }
    }

    // Additional rules
    switch (attrName) {
      case 'style':
        if (value.startsWith('url(#')) {
          value = `fill:${value}`;
        }
        break;
      case 'stop-opacity':
      case 'fill-opacity':
      case 'stroke-opacity':
      case 'opacity':
        value = parseFloat(value).toFixed(2);
        break;
      // fill-rule, gradientTransform, etc. left as is
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

    // attributes
    while (tokenIndex < tokens.length) {
      const look = peekToken();
      if (!look || look.a >= 0x80) break; // end tag or new node

      // <style> content?
      if (tagName === 'style') {
        if (look.b === 0x21) {
          node.styleContent = decodeStringValue(true);
          break;
        }
      }

      // decode attribute
      const attrToken = nextToken();
      const attrName = ATTRIBUTES[attrToken.a] || "INVALIDATTRIBUTE";
      const val = decodeAttributeValue(attrName);
      if (val !== undefined && val !== null && val !== "") {
        node.attrs[attrName] = val;
      }
    }

    // children
    while (tokenIndex < tokens.length) {
      const look = peekToken();
      if (!look) break;
      // end tag?
      if (look.a >= 0x80 && look.a < 0xC0) {
        const endToken = nextToken();
        const endTagIndex = endToken.a - 0x80;
        if (endTagIndex !== tagIndex) {
          console.warn("Warning: Mismatched tags");
        }
        return node;
      }
      // decode child
      const child = decodeNode();
      if (child) {
        node.children.push(child);
      }
    }
    return node;
  }

  const root = decodeNode();
  // If root is invalid, treat as <svg>
  if (root && root.tag === "INVALIDTAG") {
    root.tag = "svg";
  }
  return root;
}

/*
  ------------------------------------------------------------
  4) BUILD XML FROM INTERNAL NODE STRUCTURES
  ------------------------------------------------------------
*/

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
    // actual CSS text in styleContent
    inner = node.styleContent || "";
  } else {
    // child nodes
    inner = node.children.map(buildXML).join("");
  }

  return `<${node.tag}${attrs}>${inner}</${node.tag}>`;
}

/*
  ------------------------------------------------------------
  5) MERGING MULTIPLE SVGs INTO ONE
  ------------------------------------------------------------
*/

/**
 * Merges an array of "root SVG nodes" into a single <svg>.
 * Steps:
 *  - We create one <svg> as the "final" root.
 *  - We combine all <defs> into one <defs> at the top.
 *  - The visible content of each root is placed in a <g> with an ID like "traitN".
 * NOTE: Potential ID collisions within <defs> are not handled here. If you have
 * identical IDs, you may need more advanced logic to rename them.
 */
function mergeSVGs(rootNodes) {
  if (rootNodes.length === 0) {
    throw new Error("No root nodes to merge");
  }

  // Start with a fresh root <svg>
  const mergedRoot = {
    tag: "svg",
    attrs: {
      xmlns: "http://www.w3.org/2000/svg",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
      viewBox: "0 0 420 420" // or pick from the first node's viewBox, etc.
    },
    children: []
  };

  // Create one shared <defs>
  const mergedDefs = {
    tag: "defs",
    attrs: {},
    children: []
  };

  // For each root node, gather its <defs> children and visible children
  rootNodes.forEach((root, index) => {
    if (!root) return;
    // copy any root-level attributes if you want (e.g. width, height) from the first
    if (index === 0) {
      // if the first node has a viewBox, preserve it
      if (root.attrs.viewBox) {
        mergedRoot.attrs.viewBox = root.attrs.viewBox;
      }
      // If it has width/height, preserve them
      if (root.attrs.width) {
        mergedRoot.attrs.width = root.attrs.width;
      }
      if (root.attrs.height) {
        mergedRoot.attrs.height = root.attrs.height;
      }
    }

    // find any <defs> among root.children
    const rootDefs = root.children.find(c => c.tag === 'defs');
    if (rootDefs) {
      // push its children into mergedDefs.children
      mergedDefs.children.push(...rootDefs.children);
    }

    // everything else, wrap in a <g> so we keep them separate
    const groupForTrait = {
      tag: "g",
      attrs: { id: `trait${index + 1}` },
      children: []
    };

    root.children.forEach(child => {
      if (child.tag !== 'defs') {
        groupForTrait.children.push(child);
      }
    });

    mergedRoot.children.push(groupForTrait);
  });

  // Insert the merged <defs> at the top
  mergedRoot.children.unshift(mergedDefs);

  return mergedRoot;
}

/*
  ------------------------------------------------------------
  6) MAIN CLI LOGIC
  ------------------------------------------------------------
*/

if (require.main === module) {
  if (process.argv.length < 3) {
    console.log("Usage: node dsl_decoder.js <hexFile1> [<hexFile2> ...]");
    process.exit(1);
  }

  // All hex files after the script name
  const hexFiles = process.argv.slice(2);
  try {
    const decodedRoots = [];

    // 1) Decode each file into a root node
    for (let file of hexFiles) {
      const hexString = fs.readFileSync(file, "utf8");
      const tokens = hexToTokens(hexString);
      const rootNode = decodeRootNodeFromTokens(tokens);

      // Ensure we have a valid <svg> structure
      if (!rootNode) {
        throw new Error(`Failed to decode SVG from ${file}`);
      }

      // Make sure the root has default xmlns
      if (!rootNode.attrs["xmlns"]) {
        rootNode.attrs["xmlns"] = "http://www.w3.org/2000/svg";
      }
      if (!rootNode.attrs["xmlns:xlink"]) {
        rootNode.attrs["xmlns:xlink"] = "http://www.w3.org/1999/xlink";
      }

      // If there's a <defs>, but no <style>, optionally inject fallback style
      const defsNode = rootNode.children.find(c => c.tag === 'defs');
      if (defsNode) {
        let styleNode = defsNode.children.find(c => c.tag === 'style');
        if (!styleNode) {
          styleNode = {
            tag: 'style',
            attrs: {},
            styleContent: '\n      .cls-1 {\n        fill: url(#radial-gradient);\n      }\n    '
          };
          defsNode.children.unshift(styleNode);
        } else if (!styleNode.styleContent || !styleNode.styleContent.trim()) {
          styleNode.styleContent = '\n      .cls-1 {\n        fill: url(#radial-gradient);\n      }\n    ';
        }
      }

      decodedRoots.push(rootNode);
    }

    // 2) Merge them into a single <svg>
    const mergedRoot = mergeSVGs(decodedRoots);

    // 3) Output final combined SVG
    const finalSVG = '<?xml version="1.0" encoding="UTF-8"?>\n' + buildXML(mergedRoot);
    console.log(finalSVG);

  } catch (err) {
    console.error("Error decoding/merging SVG:", err.message);
    process.exit(1);
  }
}