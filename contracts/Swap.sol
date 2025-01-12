// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Swap is ReentrancyGuard, Ownable {
    struct Pool {
        uint256 token0Balance;
        uint256 token1Balance;
        uint256 fee;
    }
    
    mapping(bytes32 => Pool) public pools;
    
    event PoolCreated(address indexed token0, address indexed token1, uint256 fee);
    event Swapped(
        address indexed token0,
        address indexed token1,
        address indexed user,
        uint256 amountIn,
        uint256 amountOut
    );
    
    function createPool(
        address token0,
        address token1,
        uint256 fee
    ) external onlyOwner {
        require(token0 != token1, "Same tokens");
        require(fee <= 1000, "Fee too high"); // Max 10%
        
        bytes32 poolId = keccak256(abi.encodePacked(token0, token1));
        require(pools[poolId].fee == 0, "Pool exists");
        
        pools[poolId] = Pool(0, 0, fee);
        emit PoolCreated(token0, token1, fee);
    }
    
    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external nonReentrant {
        bytes32 poolId = keccak256(abi.encodePacked(token0, token1));
        Pool storage pool = pools[poolId];
        require(pool.fee > 0, "Pool not found");
        
        IERC20(token0).transferFrom(msg.sender, address(this), amount0);
        IERC20(token1).transferFrom(msg.sender, address(this), amount1);
        
        pool.token0Balance += amount0;
        pool.token1Balance += amount1;
    }
    
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external nonReentrant returns (uint256 amountOut) {
        bytes32 poolId = keccak256(abi.encodePacked(tokenIn, tokenOut));
        Pool storage pool = pools[poolId];
        require(pool.fee > 0, "Pool not found");
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        uint256 amountWithFee = amountIn * (1000 - pool.fee);
        amountOut = (amountWithFee * pool.token1Balance) / (pool.token0Balance * 1000 + amountWithFee);
        
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        pool.token0Balance += amountIn;
        pool.token1Balance -= amountOut;
        
        emit Swapped(tokenIn, tokenOut, msg.sender, amountIn, amountOut);
    }
} 