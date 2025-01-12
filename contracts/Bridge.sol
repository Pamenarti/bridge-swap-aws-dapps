// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Bridge is ReentrancyGuard, Ownable {
    mapping(address => mapping(uint256 => bool)) public processedNonces;
    mapping(address => uint256) public chainSupportedTokens;
    
    event TokensLocked(
        address indexed token,
        address indexed from,
        uint256 amount,
        uint256 destinationChainId,
        uint256 nonce
    );
    
    event TokensUnlocked(
        address indexed token,
        address indexed to,
        uint256 amount,
        uint256 sourceChainId,
        uint256 nonce
    );
    
    function lockTokens(
        address token,
        uint256 amount,
        uint256 destinationChainId,
        uint256 nonce
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(!processedNonces[msg.sender][nonce], "Transfer already processed");
        
        processedNonces[msg.sender][nonce] = true;
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        emit TokensLocked(token, msg.sender, amount, destinationChainId, nonce);
    }
    
    function unlockTokens(
        address token,
        address to,
        uint256 amount,
        uint256 sourceChainId,
        uint256 nonce,
        bytes memory signature
    ) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(!processedNonces[to][nonce], "Transfer already processed");
        
        processedNonces[to][nonce] = true;
        
        IERC20(token).transfer(to, amount);
        
        emit TokensUnlocked(token, to, amount, sourceChainId, nonce);
    }
} 