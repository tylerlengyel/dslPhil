// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title TraitWings - Stores DSL Hex data for the "Wings" trait
contract TraitWings {
    // The DSL Hex data is stored as a constant byte array.
    // Replace the hex literal below with the actual output from your conversion script.
    bytes private constant DSL_HEX = hex"d9001600a4011700a401c200020009204d003100330038002e00330020003300300036002e003200630035002e0039002d00310030002e0038002000330030002e0033002d00320034002e0032002000340032002e0034002d00320032002e003300200036002e003600200031002e003600200034002e003900200036002e003700200038002e0039002000310031002e003500200037002e0035002000310030002e0039002000310037002e003100200036002e0037002000320034002e00380020003100310020002e003700200034002e00350020003100200037002e0031002d0034002e003200200033002e0031002d0031002e003100200032002e0031002d003500200032002e0037002d0034002e0039002d002e0033002d0031002e0038002e0033002d0032002e003400200032002e0031002d0034002e003300200033002d0033002e003600200032002e0035002d0032002e0039002d0032002e0038002d0032002e0036002d0033002e0039002d002e003600200030002d0031002e003300200031002d0031002e003900200031002e0032002d0032002e003300200031002e0034002d0035002e0038002d0031002d0035002e0038002d0033002e0039002d0032002e003900200038002e0033002d0038002e003200200036002e0031002d0039002e0031002d0031002e003700200030002d002e003700200030002d002e0038002d002e0032002d0031002e0035002d0031002e003100200032002e0032002d0032002e003600200035002e0035002d0033002e003800200037002e0033002d0031002e003900200032002e0033002d0035002e0035002e0031002d0036002e0033002d0032002d0031002e0033002d0032002e0033002d002e0039002d0034002e0038002d0031002d0037002e0033002d0032002e003200200033002e0036002d0035002e003600200038002d0039002e003600200039002e0035002d0038002e003900200031002e0034002d0033002e0038002d0036002e0038002d002e0032002d00310030002e0032002d003200200031002e0037002d00320033002e0033002000310032002d00320032002e003200200036002e0035006d003100350039002e0034002000330063002d0035002e0033002d00310030002d00320036002e0036002d00320032002e0038002d00330037002e0038002d00320031002e0033002d0036002e003400200031002e0035002d003500200038002e0031002d0039002e0036002000310032002e0032002d0035002e003900200038002e0031002d00320031002e003100200034002e0033002d00320031002e003300200038002e0039002d002e003500200034002e00340020003000200034002e003700200033002e003900200031002e0039002000310020003200200034002e003500200032002e003500200034002e0034002d002e003200200031002e0036002e003300200032002e00310020003200200033002e003800200032002e003800200033002e003200200032002e003400200032002e0036002d0032002e003600200032002e0034002d0033002e0036002e00350020003000200031002e0031002e003900200031002e003700200031002e003200200032002e003100200031002e003400200035002e0033002d002e003900200035002e0033002d0033002e003500200032002e003500200037002e003700200037002e003300200035002e003800200038002e0032002d0031002e003400200030002d002e003600200030002d002e0038002e0032002d0031002e0034002e00390020003200200032002e003200200035002e003100200033002e003300200036002e003800200031002e003600200032002e0032002000350020002e003200200035002e0037002d0031002e003700200031002e0032002d0032002e0031002e0039002d0034002e003400200031002d0036002e003700200031002e003900200033002e003300200034002e003900200037002e003500200038002e00350020003900200038002e003100200031002e003500200033002e0034002d0036002e0033002e0033002d0039002e003400200031002e003900200031002e0037002000320030002e0036002000310031002e0035002000310039002e003900200036002e0034007a001c000c20660069006c006c003a00230066006600630065003000300082009900d9001600a4011700a401c2000200bb204d0031003300380020003300310039002e003700630034002e0035002d0032002e003100200039002e0036002d0034002e0035002000310033002d0038002e003200200032002e003100200031002e0033002d002e003500200034002e0037002d002e003500200037002e0032002d0031002e0031002000310030002e0031002000310034002e0035002d0034002000310037002e0031002d0035002e003500200031002e0032002000310020003000200034002e0037002e003600200036002e003500200031002e003800200034002e003500200039002e0034002d0031002e0035002000310032002d0034002e003100200034002e0033002d0034002e0037002d003100200034002e003300200035002e003200200033002e003500200033002e0036002d0031002e003400200034002d0032002e003600200038002d003500200031002e003300200033002e003900200036002e003200200031002e003900200038002e0033002d002e003700200031002e003600200032002e003900200035002e003500200032002e003900200037002e0033002e003300200031002e003200200033002e003100200036002e003900200032002e003200200036002e0037002d0031002e0032002d002e0032002d002e0039002d0031002d0031002e0039002d0031002d0031002e0033002d003100200031002e0034002d0033002e0035002d002e0039002d0034002e0035002d0031002e0035002d002e003900200031002e0035002d003300200032002e0035002d0034002e003500200031002e0032002d002e0036002d002e003700200030002d0032002e0035002d0031002e0033002d0031002e0032002d0032002e003300200032002e0031002d003700200036002e0032002d0036002e0032002d002e003100200030002d002e0033002e0036002d0031002e003300200030002d0031002e0031002d0033002e003100200033002d0037002e003100200031002e0036002d0037002e0035002d0032002e0037002d0031002e003800200033002e0032002d0031002e003600200034002e0035002d0034002e003300200035002e0035002d0033002e0035002d002e0035002d0034002e0034002d0034002e0033002d0034002e0038002d0037002e0033002d002e0031002d0032002e0032002d002e0033002d002e0039002d00310020002e0034002d0031002e003200200031002e0039002d0031002e003900200035002e0031002d003400200036002e0033002d0035002e003700200031002e0032002d0036002e0036002d0036002e0032002d0036002e0032002d00310030002e0031002d0032002e003700200033002e0039002d0035002e003100200037002e0038002d0039002e003800200039002e0036002d0032002e0032002e0036002d0035002e0036002d002e0034002d0034002e0036002d0033002e0032002e0037002d0033002e003100200032002e0039002d0034002e003700200034002e0037002d0037002d0031002e003500200031002e0036002d00320032002e0037002000310031002e0034002d00320032002e003400200037002d0032002e003400200035002e0034002d0036002e003800200037002e0038002d0035002e0035002000310034002e003700200031002e0038002d002e003600200033002e0036002d0031002e003200200035002e0033002d0031002e00380076002d002e0032005a006d003100350039002e003800200031002e00390063002d0034002e0031002d0032002d0038002e0036002d0034002e0034002d00310031002e0036002d0037002e0038002d0031002e003900200031002e0032002e003400200034002e0033002e003400200036002e0036002e003800200039002e0034002d00310033002d0033002e0039002d00310035002e0033002d0035002e0034002d0031002e0031002e0039002d002e003200200034002e0033002d002e003600200036002d0031002e003800200034002e0031002d0038002e0034002d0031002e0036002d00310030002e0038002d0034002d0033002e0038002d0034002e0034002e003800200034002d0034002e003700200033002e0031002d0033002e0033002d0031002e0034002d0033002e0036002d0032002e0035002d0037002e0031002d0034002e0038002d0031002e003300200033002e0036002d0035002e003600200031002e0036002d0037002e0035002d002e0038002d0031002e003500200032002e0037002d003500200032002e0035002d0036002e0036002e0032002d0031002e003100200032002e0039002d0036002e003300200031002e0039002d0036002d0031002e0033002e0032002d002e0038002e0039002d0031002e0037002e0039002d0031002e00320020003100200031002e003300200033002e0031002d002e003700200034002e0031002d0031002e0033002e003800200031002e003400200032002e003600200032002e00330020003400200031002e0032002e0036002d002e003600200030002d0032002e003300200031002e0032002d0031002e003100200032002e00310020003200200036002e003200200035002e003800200035002e00360020003000200030002d002e0033002d002e0035002d0031002e003200200030002d0031002e003100200032002e003800200032002e003800200036002e003400200031002e003500200036002e0038002d0032002e003400200031002e00360020003300200031002e003300200034002e003100200033002e003800200035002e003100200033002e0032002d002e003400200034002d0033002e003900200034002e0034002d0036002e0036002e0032002d00320020002e0033002d002e0039002e0039002e003400200031002e003100200031002e003800200031002e003700200034002e003800200033002e003500200035002e003900200035002e003200200031002e003200200036002d0035002e003600200035002e0038002d0039002e003200200032002e003300200033002e003500200034002e003500200037002e003400200038002e00370020003900200031002e0037002e003500200033002e0036002e003200200034002e0033002d0031002e0035002e0032002d0033002e0033002d0032002e0034002d0035002e0036002d0034002e0032002d003800200031002e003300200031002e0035002000320030002e003300200031003100200032003000200036002e003900200032002e003100200035002e00310020003600200037002e003300200034002e0038002000310033002e0037006c002d0034002e0038002d0031002e0038007a001c000c20660069006c006c003a00230065003600300030006600660082009900d9001600a4011700a401c20002005b204d003100330031002e00380020003300350034002e0035006300310020003000200036002e0034002e003400200036002e0037002e003300200030002d0034002e0036002d002e0039002d00310037002e003100200032002e0032002d00320031002e0031002d0031002e003100200033002e003700200033002e0036002000310036002e003100200038002e0037002000310030002e0033002e0038002d0034002e003400200031002d00310032002e003100200034002e0033002d00310035002e00350020003000200034002e003200200032002e0034002000310030002e003200200036002e00380020003900200031002e0036002d0031002e003300200033002e0039002d0037002e003200200034002e0039002d0038002e003600200031002e0032002d0032002e003500200031002e0036002d0034002e003400200031002e0038002d0034002e0033002d002e003600200031002e0034002d002e003400200037002e003700200033002e003300200037002e003600200035002e0035002d002e003800200037002e0036002d0037002e0034002000310030002e0035002d00310031002e003400200033002e003200200039002e003900200038002e003400200031002e0039002000310031002e0037002d0032002e0032002e003300200037002e003400200036002e003900200032002e003500200039002e0038002d002e0034002d002e003700200035002e003400200036002e003200200032002e003100200037002e0037002d002e003800200031002e003800200033002e003400200038002e00340020003000200035002e0032002d0033002e0039002d0031002e003200200032002e0038002d0035002e003300200032002e0036002d0036002e0036002e0032002d0032002e003300200032002e0036002d0035002e003400200032002e0035002d0037002e0032002d002e0034002d003200200032002e0034002d0036002e003700200034002e0039002d0038002e0033002e0037002d0033002e003800200031002e0039002d0037002e003600200037002e0036002d0031003100200033002e0038002d002e0037002d0031002e0032002e0032002d0032002e0036002d002e0034002d0033002e0036002d002e0035002d002e0031002d002e0039002e0035002d0031002e0031002e0037002d003200200032002e0035002d0036002e003100200035002e0031002d0038002e003900200036002d003200200031002e0033002d0034002e0035002d002e0036002d0034002d0032002e0038002e0031002d0033002e0038002e0039002d0037002e0034002d0033002e0038002d0032002e0033002d0032002e003500200031002e0039002d00310034002e0037002000310031002e0035002d00310033002e003800200032002e003900200030002d0032002e003200200032002e0036002d00360020002e0035002d0037002e0032002d0035002e003400200035002e0033002d00310031002e003500200037002e0038002d00310038002e0033002000310030002d003600200039002e0034002d0038002e0032002000320033002e0039002d002e0038002000330033002e00310068002e0031005a006d003100370031002d002e00360063002d002e003900200030002d0035002e0038002e0033002d0036002e0031002e003100200030002d0034002e003300200031002e0031002d00310035002e0037002d0031002e0037002d00310039002e00350020003100200033002e0033002d0033002e0034002000310034002e0038002d003800200039002e0034002d002e0037002d0034002e0031002d002e0037002d00310031002e0031002d0033002e0037002d00310034002e00340020003000200033002e0038002d0032002e003300200039002e0033002d0036002e003300200038002e0032002d0032002e0031002d0032002e0033002d0035002e0031002d00310030002e0031002d0035002e0038002d003100320020002e003500200031002e0033002e003300200037002e0031002d0033002e003100200037002d0035002d002e0039002d0036002e0038002d0037002d0039002e0033002d00310030002e0037002d0032002e003900200039002d0037002e003700200031002e0036002d00310030002e0035002d0032002e0033002d002e003400200036002e0038002d0036002e003300200032002e0032002d0038002e0038002d002e0035002e003500200035002d0035002e003600200031002e0039002d0036002e0039002d002e0039002d0031002e003700200033002e0031002d0037002e0035002d002e0033002d0034002e0037002d0033002e003700200031002e003100200032002e003600200034002e003700200032002e0035002000360020002e00330020003200200032002e003500200034002e003800200032002e003400200036002e0035002d002e003200200031002e003800200032002e00320020003600200034002e003700200037002e0035002e003800200033002e003400200031002e003800200036002e003800200037002e003100200039002e003900200033002e0037002e0036002d0031002e0031002d002e0031002d0032002e0034002e0034002d0033002e0034002e0034002000300020002e0038002e0035002000310020002e003600200031002e003800200032002e003300200035002e003400200034002e003800200037002e003900200035002e003700200037002e003400200033002e0031002d002e0032002d00310032002e003800200037002e0031002d0034002e003600200032002e003200200031002e0038002000310033002e0031002000310030002e0039002000310032002e003400200032002e003900200030002d0032002d0032002e0033002d0035002e0035002d002e0034002d0036002e003600200034002e003700200035002000310030002e003200200037002e0034002000310036002e003300200039002e003600200035002e003300200038002e003800200037002e0031002000320032002e0031002e0032002000330030002e0035007a001c000c20660069006c006c003a00230030003000310033006600660082009900"; // example placeholder

    /// @notice Returns the DSL Hex data for this trait.
    /// Uses inline assembly to efficiently load the data.
    function getDSLHex() external pure returns (bytes memory data) {
        // Copy the constant into a memory variable.
        bytes memory dsl = DSL_HEX;
        assembly {
            // Get the free memory pointer
            data := mload(0x40)
            // Read the length of dsl from memory
            let len := mload(dsl)
            mstore(data, len)
            // Calculate pointer to dsl data (skip the length slot)
            let sourcePtr := add(dsl, 32)
            // Destination pointer (after the length slot in data)
            let destPtr := add(data, 32)
            // Copy dsl data into data, 32 bytes at a time.
            for { let i := 0 } lt(i, len) { i := add(i, 32) } {
                mstore(add(destPtr, i), mload(add(sourcePtr, i)))
            }
            // Update free memory pointer
            mstore(0x40, add(destPtr, len))
        }
    }
}