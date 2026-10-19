// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title BelajarBadge
/// @notice Badge soulbound (tidak bisa dipindahtangankan) untuk pengguna BelajarOnchain.
///         Badge hanya bisa di-claim dengan tanda tangan dari server, sebagai bukti
///         bahwa pengguna sudah lulus kuis. Kontrak ini tidak menyimpan dan tidak
///         menyentuh dana siapa pun.
/// @notice Soulbound badges for BelajarOnchain users. Minting requires a server signature
///         proving the user passed the quiz. This contract never holds or moves funds.
contract BelajarBadge is ERC1155, Ownable, EIP712 {
    bytes32 public constant CLAIM_TYPEHASH =
        keccak256("Claim(address account,uint256 tokenId,uint256 deadline)");

    string public constant name = "BelajarOnchain Badge";
    string public constant symbol = "BELAJAR";

    /// @notice Alamat server yang berhak menandatangani bukti lulus kuis.
    address public signer;

    /// @notice Sudahkah `account` meng-claim badge `tokenId`?
    mapping(address account => mapping(uint256 tokenId => bool)) public hasClaimed;

    mapping(uint256 tokenId => string) private _tokenURIs;

    event SignerChanged(address indexed oldSigner, address indexed newSigner);
    event Claimed(address indexed account, uint256 indexed tokenId);

    error BadgeNotFound(uint256 tokenId);
    error AlreadyClaimed(address account, uint256 tokenId);
    error SignatureExpired(uint256 deadline);
    error InvalidSignature();
    error Soulbound();
    error ZeroAddress();
    error EmptyURI();

    constructor(address initialOwner, address initialSigner)
        ERC1155("")
        Ownable(initialOwner)
        EIP712("BelajarBadge", "1")
    {
        _setSigner(initialSigner);
    }

    // ---------------------------------------------------------------------
    // Pengguna
    // ---------------------------------------------------------------------

    /// @notice Claim badge `tokenId` dengan tanda tangan server yang berlaku sampai `deadline`.
    function claim(uint256 tokenId, uint256 deadline, bytes calldata signature) external {
        if (bytes(_tokenURIs[tokenId]).length == 0) revert BadgeNotFound(tokenId);
        if (block.timestamp > deadline) revert SignatureExpired(deadline);
        if (hasClaimed[msg.sender][tokenId]) revert AlreadyClaimed(msg.sender, tokenId);

        bytes32 digest =
            _hashTypedDataV4(keccak256(abi.encode(CLAIM_TYPEHASH, msg.sender, tokenId, deadline)));
        (address recovered, ECDSA.RecoverError err,) = ECDSA.tryRecover(digest, signature);
        if (err != ECDSA.RecoverError.NoError || recovered != signer) revert InvalidSignature();

        hasClaimed[msg.sender][tokenId] = true;
        emit Claimed(msg.sender, tokenId);
        _mint(msg.sender, tokenId, 1, "");
    }

    /// @notice Digest EIP-712 yang harus ditandatangani server (dipakai juga oleh backend & tes).
    function claimDigest(address account, uint256 tokenId, uint256 deadline)
        external
        view
        returns (bytes32)
    {
        return _hashTypedDataV4(keccak256(abi.encode(CLAIM_TYPEHASH, account, tokenId, deadline)));
    }

    /// @notice Apakah badge `tokenId` sudah dibuat oleh owner?
    function badgeExists(uint256 tokenId) external view returns (bool) {
        return bytes(_tokenURIs[tokenId]).length != 0;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    // ---------------------------------------------------------------------
    // Owner
    // ---------------------------------------------------------------------

    /// @notice Membuat badge baru atau mengganti URI metadata badge yang sudah ada.
    function setBadge(uint256 tokenId, string calldata tokenURI) external onlyOwner {
        if (bytes(tokenURI).length == 0) revert EmptyURI();
        _tokenURIs[tokenId] = tokenURI;
        emit URI(tokenURI, tokenId);
    }

    /// @notice Mengganti alamat signer server (misalnya bila kunci signer bocor).
    function setSigner(address newSigner) external onlyOwner {
        _setSigner(newSigner);
    }

    // ---------------------------------------------------------------------
    // Soulbound: hanya mint yang diizinkan
    // ---------------------------------------------------------------------

    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override
    {
        if (from != address(0)) revert Soulbound();
        super._update(from, to, ids, values);
    }

    function _setSigner(address newSigner) private {
        if (newSigner == address(0)) revert ZeroAddress();
        emit SignerChanged(signer, newSigner);
        signer = newSigner;
    }
}
