// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title TraitColor - Stores DSL Hex data for the "Color" trait
contract TraitColor {
    // The DSL Hex data is stored as a constant byte array.
    // Replace the hex literal below with the actual output from your conversion script.
    bytes private constant DSL_HEX = hex"c040..."; // example placeholder

    /// @notice Returns the DSL Hex data for this trait.
    /// Uses inline assembly to efficiently load the data.
    function getDSLHex() external pure returns (bytes memory data) {
        assembly {
            // Load pointer to free memory
            data := mload(0x40)
            // Store length of DSL_HEX (first 32 bytes of the constant)
            let len := mload(DSL_HEX)
            mstore(data, len)
            // Calculate pointer to DSL_HEX data (skip length slot)
            let sourcePtr := add(DSL_HEX, 32)
            // Calculate destination pointer (after the length slot in data)
            let destPtr := add(data, 32)
            // Copy DSL_HEX data into memory (using a loop, copying 32 bytes at a time)
            for { let i := 0 } lt(i, len) { i := add(i, 32) } {
                mstore(add(destPtr, i), mload(add(sourcePtr, i)))
            }
            // Update free memory pointer
            mstore(0x40, add(destPtr, len))
        }
    }
}
