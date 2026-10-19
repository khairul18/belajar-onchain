// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BelajarBadge} from "../src/BelajarBadge.sol";

/// @notice Uji claim dari terminal: script bertindak sebagai "server" (menandatangani
///         dengan SIGNER_PRIVATE_KEY), lalu wallet --account meng-claim badge TOKEN_ID.
contract TestClaim is Script {
    function run() external {
        BelajarBadge badge = BelajarBadge(vm.envAddress("BADGE_ADDRESS"));
        uint256 signerKey = vm.envUint("SIGNER_PRIVATE_KEY");
        uint256 tokenId = vm.envOr("TOKEN_ID", uint256(1));
        uint256 deadline = block.timestamp + 10 minutes;

        vm.startBroadcast();
        (, address claimer,) = vm.readCallers();
        (uint8 v, bytes32 r, bytes32 s) =
            vm.sign(signerKey, badge.claimDigest(claimer, tokenId, deadline));
        badge.claim(tokenId, deadline, abi.encodePacked(r, s, v));
        vm.stopBroadcast();

        console.log("Claimer:", claimer);
        console.log("Saldo badge:", badge.balanceOf(claimer, tokenId));
    }
}
