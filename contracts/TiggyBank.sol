// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TiggyBankMatic
 * @dev Splits incoming MATIC: 40% to user vault, 60% to global pool.
 */
contract TiggyBank is Ownable {
    // user => vault balance (in MATIC)
    mapping(address => uint256) public vaultBalance;
    // global pool balance (in MATIC)
    uint256 public poolBalance;

    event Deposited(address indexed user, uint256 amount, uint256 toVault, uint256 toPool);
    event VaultWithdrawn(address indexed user, uint256 amount);
    event PoolWithdrawn(address indexed owner, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice User deposits MATIC, split 40/60.
     * @dev Send MATIC directly with the transaction.
     */
    function deposit() external payable {
        _deposit(msg.sender, msg.value);
    }

    /**
     * @notice Deposit MATIC on behalf of a user, split 40/60.
     * @param user The address of the user to deposit for.
     */
    function depositFor(address user) external payable {
        _deposit(user, msg.value);
    }

    function _deposit(address user, uint256 amount) internal {
        require(amount > 0, "0 amount");
        uint256 toVault = (amount * 40) / 100;
        uint256 toPool = amount - toVault;
        vaultBalance[user] += toVault;
        poolBalance += toPool;
        emit Deposited(user, amount, toVault, toPool);
    }

    /**
     * @notice Withdraw your vault MATIC.
     */
    function withdrawVault(uint256 amount) external {
        require(amount > 0, "0 amount");
        require(vaultBalance[msg.sender] >= amount, "insufficient vault");
        vaultBalance[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit VaultWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Withdraw entire user's vault MATIC.
     */
    function withdrawAllSavings() external {
        uint256 amount = vaultBalance[msg.sender];
        require(amount > 0, "No savings to withdraw");
        vaultBalance[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit VaultWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Owner withdraws from the global pool.
     */
    function withdrawPool(uint256 amount) external onlyOwner {
        require(amount > 0, "0 amount");
        require(poolBalance >= amount, "insufficient pool");
        poolBalance -= amount;
        payable(owner()).transfer(amount);
        emit PoolWithdrawn(owner(), amount);
    }

    /**
     * @notice Admin function to manage global pool (e.g., move to yield strategies)
     */
    function managePool(address to, uint256 amount) external onlyOwner {
        require(amount <= poolBalance, "Exceeds pool balance");
        poolBalance -= amount;
        payable(to).transfer(amount);
        emit PoolWithdrawn(to, amount);
    }

    /**
     * @notice Allow contract to receive MATIC directly.
     */
    receive() external payable {
        _deposit(msg.sender, msg.value);
    }
}
