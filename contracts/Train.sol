// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Tickets.sol";

abstract contract Train is ERC20, Ownable {

    enum TrainState {Boarding, Departed, Arrived, Canceled, Derailed}

    modifier onlyWhenBoarding() {
        require(_trainState == TrainState.Boarding, "Train: Train is not boarding");
        _;
    }

    modifier onlyWhenDeparted() {
        require(_trainState == TrainState.Departed, "Train: Train has not departed");
        _;
    }

    modifier needsTicket() {
        require(_tickets.balanceOf(msg.sender) > 0, "Train: not enough tickets");
        _;
    }

    ERC20 private _underlying;
    Tickets private _tickets;

    uint256 internal _quotaPrecision = 1e6;
    uint256 private _departureBlock;
    string private _derailReason;

    TrainState private _trainState;

    function _conduct(address conductor) internal virtual;

    constructor (address underlying_, string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _trainState = TrainState.Boarding;
        _underlying = ERC20(underlying_);
        uint8 underlyingDecimals = _underlying.decimals();
        require(underlyingDecimals > 0, "Train: Underlying asset has 0 decimals.");
        _setupDecimals(underlyingDecimals);
    }

    function underlying() external view returns (address) {
        return address(_underlying);
    }

    function tickets() external view returns (address) {
        return address(_tickets);
    }

    function sweep(address token, address to) external onlyOwner {
        _sweep(ERC20(token), to);
    }

    function emergencyExit() external onlyOwner {
        _emergencyExit();
    }

    function board(address to, uint256 amount) external onlyWhenBoarding needsTicket {
        _mint(to, amount);
    }

    function unboard(address from, uint256 amount) external {
        _burn(from, amount);
    }

    function conduct() external onlyWhenDeparted {
        _conduct(msg.sender);
        TrainState currentState = _getTrainState();
        if (currentState == TrainState.Departed) _setTrainState(TrainState.Arrived);
    }

    function cancel() external onlyOwner {
        _setTrainState(TrainState.Canceled);
    }

    function depart() external onlyOwner {
        require(_departureBlock > 0, "Train: planDeparture() not called yet");
        require(block.number >= _departureBlock, "Train: Before planned departure");
        _setTrainState(TrainState.Departed);
    }

    function derail(string memory reason) external onlyOwner {
        _setTrainState(TrainState.Derailed);
        _setDerailReason(reason);
    }

    function planDeparture(uint256 departureBlock) external onlyOwner {
        _setDeparture(departureBlock);
    }

    function _mint(address to, uint256 amount) internal virtual override {
        require(_underlying.transferFrom(msg.sender, address(this), amount), "Train: unable to transfer underlying funds");
        super._mint(to, amount);
    }

    function _burn(address from, uint256 amount) internal virtual override {
        uint256 userShares = balanceOf(from);
        uint256 totalShares = totalSupply();
        if (userShares == 0 || totalShares == 0) return;
        require(amount <= userShares, "Train: not enough shares to burn");

        uint256 quota = userShares * _quotaPrecision / totalShares;
        _payout(from, quota, _quotaPrecision);
        super._burn(from, amount);
    }

    function _payout(address to, uint256 quota, uint256 precision) internal virtual {
        uint256 amount = _underlying.balanceOf(address(this)) * quota / precision;
        _payoutToken(_underlying, to, amount);

    }

    function _payoutToken(ERC20 token, address to, uint256 amount) internal virtual {
        require(token.transfer(to, amount), "Train: Failure during token payout");
    }

    function _sweep(ERC20 token, address to) internal virtual {
        uint256 amount = token.balanceOf(address(this));
        token.transfer(to, amount);
    }

    function _emergencyExit() internal virtual {
        _sweep(_underlying, owner());
    }

    function _getDeparture() internal virtual view returns (uint256) {
        return _departureBlock;
    }

    function _setDeparture(uint256 newDepartureBlock) internal virtual {
        _departureBlock = newDepartureBlock;
    }

    function _setTrainState(TrainState newState) internal virtual {
        _trainState = newState;
    }

    function _getTrainState() internal virtual view returns (TrainState) {
        return _trainState;
    }

    function _setDerailReason(string memory _reason) internal virtual {
        _derailReason = _reason;
    }

    function _getDerailReason() internal virtual view returns (string memory) {
        return _derailReason;
    }

}
