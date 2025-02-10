# DSL Specifications for "Fill A Phil" NFT Project

This document describes the Domain Specific Language (DSL) used to encode SVG files into hexadecimal (DSL Hex) representations. These hex strings are then stored in smart contracts on the Ethereum Classic blockchain to represent different NFT traits.

---

## Overview

The DSL is designed to compactly encode SVG elements and their attributes into a sequence of two-byte pairs. The encoding is performed in the `svgToDSL.js` script and involves:

- **Tag Definitions:** Mapping of SVG element names to numeric indices.
- **Attribute Definitions:** Mapping of SVG attribute names to numeric indices.
- **Encoding Methods:** Rules for encoding start tags, end tags, and attribute values (including numbers, percentages, colors, and strings).
- **Inline Assembly:** Low-level Solidity assembly used in the smart contracts to efficiently return the stored DSL Hex data.

---

## 1. Tag and Attribute Definitions

### TAGS Array

The `TAGS` array lists the SVG element names recognized by the converter. Each element’s index is used to encode the start and end of an element.

```js
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

	•	Usage:
	•	When processing an SVG element, the converter finds its index in the above array.
	•	If the element is not found, the index for "INVALIDTAG" is used.


ATTRIBUTES Array

The ATTRIBUTES array defines the supported SVG attribute names. Each attribute name is assigned a unique index. The updated list now includes new attributes (e.g., "style", "data-name", and several filter/effects attributes) and has only one occurrence of "values".

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
  "values",        // Only one occurrence is kept.
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
  "data-name",     // For attributes found in eyes1.svg and teeth1.svg.
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

	•	Usage:
	•	The converter uses ATTRIBUTES.indexOf(attrName) to find the index for each attribute.
	•	If an attribute is not found (or is unknown), the index for "INVALIDATTRIBUTE" is used.

2. Encoding Methods

DSL Lines

Each component (tag, attribute, or value) is encoded as a two-byte (16-bit) pair. The first byte typically holds the data value (or a part of it), and the second byte may include a marker or flag.

Start & End Tag Encoding
	•	Start Tag:
Encoded as 0x80 + 0x40 + tagIndex in the first byte and 0x00 in the second byte.
	•	End Tag:
Encoded as 0x80 + tagIndex in the first byte and 0x00 in the second byte.

Attribute Encoding
	1.	Attribute Name:
	•	The attribute’s index (from the ATTRIBUTES array) is encoded first, followed by a zero byte.
	2.	Attribute Value:
	•	Numbers:
	•	Plain Numbers:
	•	Integers are encoded as a 12-bit value (the lower 8 bits in the first byte and the upper 4 bits in the second byte).
	•	Decimals are scaled by 10 if a decimal point is present (using marker 0x10).
	•	Numeric fractions (e.g., .5) are scaled by 1000 and use marker 0x10.
	•	Percentages:
	•	Encoded with a marker 0x40 after parsing the numeric value.
	•	Colors:
	•	Hex Colors:
	•	E.g., #AABBCC is split into RGB components and each is encoded.
	•	rgb() Colors:
	•	The three numeric components are encoded similarly.
	•	Basic Named Colors:
	•	Looked up in the BASIC_COLORS mapping.
	•	Strings:
	•	Encoded by first writing the string length with a marker (0x20), then each character’s ASCII code.
	•	This covers arbitrary strings (like ids or URL references such as url(#a)).
	•	Special Case – baseFrequency:
	•	May contain two values separated by whitespace. The converter splits and encodes each part individually.


3. Inline Assembly in Smart Contracts

The smart contracts use inline assembly in the getDSLHex() function to efficiently load and return the DSL Hex data. Key points:
	•	Memory Allocation:
The free memory pointer (0x40) is used to allocate memory for the output.
	•	Data Copying:
	•	The length of the DSL_HEX constant is read from memory.
	•	The DSL_HEX data is then copied from the constant into the allocated memory.
	•	Efficiency:
This low-level operation is designed to be gas efficient when the DSL hex data is returned.


4. Versioning and Documentation
	•	Embedded in Code:
The DSL specification is implemented in the svgToDSL.js script (via the TAGS and ATTRIBUTES arrays and the encoding functions). Any updates to these arrays or functions affect the DSL directly.
	•	External Documentation:
Maintaining this document under version control ensures that any modifications are tracked. This documentation should be updated whenever the encoding logic or attribute definitions change.


5. Example of an Encoded Element

For example, consider an SVG element like:
<circle cx="5" cy="5" r="4" fill="red"/>
The encoding process would be:
	1.	Start Tag for circle:
	•	The converter looks up "circle" in the TAGS array to obtain its index.
	•	Encodes the start tag as 0x80 + 0x40 + tagIndex.
	2.	Attributes:
	•	Each attribute (cx, cy, r, and fill) is looked up in the ATTRIBUTES array.
	•	Their values are encoded based on type (e.g., integer for cx, cy, r and a named color for fill).
	3.	End Tag:
	•	The end tag is encoded as 0x80 + tagIndex.
    