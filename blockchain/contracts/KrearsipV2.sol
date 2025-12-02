// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title KrearsipV2 - Registry karya dengan pemisahan creator & registrar
contract KrearsipV2 {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        owner = newOwner;
    }

    struct WorkInfo {
        address creator;
        address registrar;
        uint256 timestamp;
        string title;
    }

    mapping(bytes32 => WorkInfo) private works;

    event WorkRegistered(
        bytes32 indexed fileHash,
        address indexed creator,
        address indexed registrar,
        string title,
        uint256 timestamp
    );

    function registerWork(
        bytes32 fileHash,
        address creator,
        string calldata title
    ) external onlyOwner {
        require(fileHash != bytes32(0), "hash kosong");
        require(creator != address(0), "creator kosong");
        require(works[fileHash].creator == address(0), "sudah terdaftar");

        works[fileHash] = WorkInfo({
            creator: creator,
            registrar: msg.sender,
            timestamp: block.timestamp,
            title: title
        });

        emit WorkRegistered(
            fileHash,
            creator,
            msg.sender,
            title,
            block.timestamp
        );
    }

    function isRegistered(bytes32 fileHash) external view returns (bool) {
        return works[fileHash].creator != address(0);
    }

    function getWork(
        bytes32 fileHash
    )
        external
        view
        returns (
            address creator,
            address registrar,
            uint256 timestamp,
            string memory title
        )
    {
        WorkInfo memory w = works[fileHash];
        return (w.creator, w.registrar, w.timestamp, w.title);
    }
}
