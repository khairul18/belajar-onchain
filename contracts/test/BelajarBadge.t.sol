// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BelajarBadge} from "../src/BelajarBadge.sol";

contract BelajarBadgeTest is Test {
    BelajarBadge badge;

    address owner = makeAddr("owner");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    uint256 signerKey;
    address signer;

    uint256 constant PEMULA = 1;
    string constant URI_1 = "https://example.com/badges/1.json";

    function setUp() public {
        (signer, signerKey) = makeAddrAndKey("signer");
        badge = new BelajarBadge(owner, signer);
        vm.prank(owner);
        badge.setBadge(PEMULA, URI_1);
    }

    function _sign(uint256 key, address account, uint256 tokenId, uint256 deadline)
        internal
        view
        returns (bytes memory)
    {
        (uint8 v, bytes32 r, bytes32 s) =
            vm.sign(key, badge.claimDigest(account, tokenId, deadline));
        return abi.encodePacked(r, s, v);
    }

    function _deadline() internal view returns (uint256) {
        return block.timestamp + 1 hours;
    }

    // --- claim valid ------------------------------------------------------

    function test_ClaimValid() public {
        uint256 deadline = _deadline();
        bytes memory sig = _sign(signerKey, alice, PEMULA, deadline);

        vm.expectEmit(true, true, false, false, address(badge));
        emit BelajarBadge.Claimed(alice, PEMULA);
        vm.prank(alice);
        badge.claim(PEMULA, deadline, sig);

        assertEq(badge.balanceOf(alice, PEMULA), 1);
        assertTrue(badge.hasClaimed(alice, PEMULA));
    }

    // --- claim tidak sah ---------------------------------------------------

    function test_RevertWhen_NoSignature() public {
        vm.prank(alice);
        vm.expectRevert(BelajarBadge.InvalidSignature.selector);
        badge.claim(PEMULA, _deadline(), "");
    }

    function test_RevertWhen_FakeSigner() public {
        (, uint256 fakeKey) = makeAddrAndKey("penipu");
        uint256 deadline = _deadline();
        bytes memory sig = _sign(fakeKey, alice, PEMULA, deadline);

        vm.prank(alice);
        vm.expectRevert(BelajarBadge.InvalidSignature.selector);
        badge.claim(PEMULA, deadline, sig);
    }

    function test_RevertWhen_SignatureForOtherAccount() public {
        uint256 deadline = _deadline();
        bytes memory sig = _sign(signerKey, alice, PEMULA, deadline);

        vm.prank(bob);
        vm.expectRevert(BelajarBadge.InvalidSignature.selector);
        badge.claim(PEMULA, deadline, sig);
    }

    function test_RevertWhen_SignatureForOtherBadge() public {
        vm.prank(owner);
        badge.setBadge(2, "https://example.com/badges/2.json");
        uint256 deadline = _deadline();
        bytes memory sig = _sign(signerKey, alice, PEMULA, deadline);

        vm.prank(alice);
        vm.expectRevert(BelajarBadge.InvalidSignature.selector);
        badge.claim(2, deadline, sig);
    }

    function test_RevertWhen_DeadlineTampered() public {
        uint256 deadline = _deadline();
        bytes memory sig = _sign(signerKey, alice, PEMULA, deadline);

        vm.prank(alice);
        vm.expectRevert(BelajarBadge.InvalidSignature.selector);
        badge.claim(PEMULA, deadline + 1 days, sig);
    }

    function test_RevertWhen_Expired() public {
        uint256 deadline = _deadline();
        bytes memory sig = _sign(signerKey, alice, PEMULA, deadline);
        vm.warp(deadline + 1);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BelajarBadge.SignatureExpired.selector, deadline));
        badge.claim(PEMULA, deadline, sig);
    }

    function test_RevertWhen_BadgeNotFound() public {
        uint256 deadline = _deadline();
        bytes memory sig = _sign(signerKey, alice, 99, deadline);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BelajarBadge.BadgeNotFound.selector, 99));
        badge.claim(99, deadline, sig);
    }

    function test_RevertWhen_OldSignerAfterRotation() public {
        (address newSigner,) = makeAddrAndKey("signer-baru");
        vm.prank(owner);
        badge.setSigner(newSigner);

        uint256 deadline = _deadline();
        bytes memory sig = _sign(signerKey, alice, PEMULA, deadline);
        vm.prank(alice);
        vm.expectRevert(BelajarBadge.InvalidSignature.selector);
        badge.claim(PEMULA, deadline, sig);
    }

    // --- claim dobel -------------------------------------------------------

    function test_RevertWhen_DoubleClaim() public {
        uint256 deadline = _deadline();
        bytes memory sig = _sign(signerKey, alice, PEMULA, deadline);

        vm.startPrank(alice);
        badge.claim(PEMULA, deadline, sig);
        vm.expectRevert(
            abi.encodeWithSelector(BelajarBadge.AlreadyClaimed.selector, alice, PEMULA)
        );
        badge.claim(PEMULA, deadline, sig);
        vm.stopPrank();
        assertEq(badge.balanceOf(alice, PEMULA), 1);
    }

    // --- soulbound ---------------------------------------------------------

    function _claimAsAlice() internal {
        uint256 deadline = _deadline();
        bytes memory sig = _sign(signerKey, alice, PEMULA, deadline);
        vm.prank(alice);
        badge.claim(PEMULA, deadline, sig);
    }

    function test_RevertWhen_Transfer() public {
        _claimAsAlice();
        vm.prank(alice);
        vm.expectRevert(BelajarBadge.Soulbound.selector);
        badge.safeTransferFrom(alice, bob, PEMULA, 1, "");
    }

    function test_RevertWhen_BatchTransfer() public {
        _claimAsAlice();
        uint256[] memory ids = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        ids[0] = PEMULA;
        amounts[0] = 1;

        vm.prank(alice);
        vm.expectRevert(BelajarBadge.Soulbound.selector);
        badge.safeBatchTransferFrom(alice, bob, ids, amounts, "");
    }

    function test_RevertWhen_Approve() public {
        vm.prank(alice);
        vm.expectRevert(BelajarBadge.Soulbound.selector);
        badge.setApprovalForAll(bob, true);
    }

    // --- owner -------------------------------------------------------------

    function test_Uri() public view {
        assertEq(badge.uri(PEMULA), URI_1);
        assertTrue(badge.badgeExists(PEMULA));
        assertFalse(badge.badgeExists(2));
    }

    function test_RevertWhen_NonOwnerSetsBadge() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        badge.setBadge(2, "x");
    }

    function test_RevertWhen_NonOwnerSetsSigner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        badge.setSigner(alice);
    }

    function test_RevertWhen_EmptyUriOrZeroSigner() public {
        vm.startPrank(owner);
        vm.expectRevert(BelajarBadge.EmptyURI.selector);
        badge.setBadge(2, "");
        vm.expectRevert(BelajarBadge.ZeroAddress.selector);
        badge.setSigner(address(0));
        vm.stopPrank();
    }

    function testFuzz_ClaimAnyAccount(address account) public {
        vm.assume(account != address(0) && account.code.length == 0);
        uint256 deadline = _deadline();
        bytes memory sig = _sign(signerKey, account, PEMULA, deadline);
        vm.prank(account);
        badge.claim(PEMULA, deadline, sig);
        assertEq(badge.balanceOf(account, PEMULA), 1);
    }
}
