# DSL Specifications for "Fill A Phil" NFT Project

This document describes the Domain Specific Language (DSL) used to encode SVG files into hexadecimal (DSL Hex) representations. These hex strings are then stored in smart contracts on the Ethereum Classic blockchain to represent different NFT traits.

---

## Overview

The DSL is designed to compactly encode SVG elements and attributes into a sequence of two-byte pairs. This encoding scheme is defined in our `svgToDSL.js` conversion script and includes:

- **Tag Definitions:** Mapping of SVG element names to indices.
- **Attribute Definitions:** Mapping of SVG attribute names to indices.
- **Encoding Methods:** Rules for encoding start tags, end tags, and attribute values.
- **Inline Assembly:** Low-level operations in Solidity to efficiently read and return DSL Hex data.

---

## 1. Tag and Attribute Definitions

### TAGS Array

The `TAGS` array lists the SVG element names that the conversion script recognizes. Each element’s index is used in the encoding process:

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
	•	When processing an SVG element, its index is determined from this array.
	•	If an element is not found, the index for "INVALIDTAG" is used.


ATTRIBUTES Array

The ATTRIBUTES array lists the SVG attribute names that the script supports:

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
  "values",
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
  "values",
  "INVALIDATTRIBUTE"
];

	•	Usage:
	•	Each attribute encountered is matched to its index in this array.
	•	Unknown attributes are skipped using the "INVALIDATTRIBUTE" index.


2. Encoding Methods

DSL Lines

Each component (tag, attribute, or value) is encoded as a two-byte (16-bit) pair.

Start & End Tags
	•	Start Tag Encoding:
The first byte is calculated as:
0x80 + 0x40 + tagIndex
The second byte is set to 0x00.
	•	End Tag Encoding:
The first byte is:
0x80 + tagIndex
The second byte is 0x00.

Attribute Encoding
	1.	Attribute Name:
	•	The attribute’s index from the ATTRIBUTES array is stored first (as one byte), followed by a byte placeholder (typically 0x00).
	2.	Attribute Value:
The encoding depends on the type of value:
	•	Numerical Values:
	•	Integers are directly encoded.
	•	Decimal values are converted to fixed-point representation.
	•	Percentages:
	•	Values ending with % are parsed and encoded with a special percentage flag.
	•	Color Values:
	•	Hexadecimal colors (e.g., #FF0000) are parsed into their RGB components and encoded.
	•	rgb(…) formats are similarly split and encoded.
	•	Special Attributes:
	•	Attributes like xmlns or viewBox are split into parts and encoded accordingly.


3. Inline Assembly in Smart Contracts

The smart contracts use inline assembly in the getDSLHex() function to efficiently load and return the DSL Hex data from storage. Here’s a simplified view of the assembly logic:
	•	Memory Allocation:
Allocate a memory block starting at the free memory pointer (0x40).
	•	Copying Data:
	•	Load the length of the DSL_HEX constant (first 32 bytes).
	•	Copy the DSL_HEX content (starting from byte 33) into the allocated memory.
	•	Update the free memory pointer after copying.

This low-level approach minimizes gas costs when returning the DSL data.


4. Versioning and Documentation
	•	Embedded in Code:
The DSL specification is implemented directly in the svgToDSL.js script. Any changes to the TAGS, ATTRIBUTES, or encoding logic directly affect the DSL.
	•	External Documentation:
It is recommended to maintain this document alongside the codebase (under version control) so that any updates to the DSL are tracked and documented.


5. Example of an Encoded Element

For instance, an SVG element such as:
<circle cx="5" cy="5" r="4" fill="red"/>
might be encoded as follows:
	1.	Start Tag for circle:
	•	Look up circle in the TAGS array to get its index.
	•	Encode using 0x80 + 0x40 + tagIndex.
	2.	Attributes:
	•	cx, cy, r, and fill are encoded by looking up their indices in the ATTRIBUTES array.
	•	Their values are processed based on whether they are numeric or color values.
	3.	End Tag:
	•	The corresponding end tag is encoded as 0x80 + tagIndex.


