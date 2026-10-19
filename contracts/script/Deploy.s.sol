// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BelajarBadge} from "../src/BelajarBadge.sol";

/// @notice Deploy BelajarBadge dan daftarkan 3 badge awal.
///         Owner = wallet yang menjalankan script (--account deployer).
contract Deploy is Script {
    function run() external returns (BelajarBadge badge) {
        address signer = vm.envAddress("SIGNER_ADDRESS");
        string memory baseURI = vm.envOr(
            "BADGE_BASE_URI",
            string("https://raw.githubusercontent.com/khairul18/belajar-onchain/main/app/public/badges/")
        );

        vm.startBroadcast();
        (, address deployer,) = vm.readCallers();
        badge = new BelajarBadge(deployer, signer);
        badge.setBadge(1, string.concat(baseURI, "1.json"));
        badge.setBadge(2, string.concat(baseURI, "2.json"));
        badge.setBadge(3, string.concat(baseURI, "3.json"));
        vm.stopBroadcast();

        console.log("BelajarBadge:", address(badge));
        console.log("Owner:", deployer);
        console.log("Signer:", signer);
    }
}
