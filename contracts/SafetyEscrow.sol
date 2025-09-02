// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SafetyEscrow
 * @dev Smart contract for escrowing ETH payments for tourist bookings with safety SLA verification
 */
contract SafetyEscrow is Ownable, ReentrancyGuard {
    
    // Booking status enum
    enum BookingStatus {
        Pending,        // Initial state after deposit
        SLAPassed,      // SLA verification passed
        SLAFailed,      // SLA verification failed
        Refunded,       // ETH refunded to tourist
        Paid,           // ETH paid to operator
        Disputed        // Dispute raised, awaiting arbiter decision
    }
    
    // Booking structure
    struct Booking {
        address tourist;        // Tourist who made the booking
        address operator;       // Tour operator
        uint256 amount;         // ETH amount in escrow
        uint256 depositTime;    // When the deposit was made
        uint256 slaDeadline;    // SLA verification deadline
        BookingStatus status;   // Current booking status
        bool slaVerified;       // Whether SLA has been verified
        string bookingId;       // Unique booking identifier
    }
    
    // Contract configuration
    uint256 public constant SLA_TIMEOUT_HOURS = 24; // 24 hours for SLA verification
    uint256 public constant PENALTY_PERCENTAGE = 10; // 10% penalty for failed SLA
    uint256 public constant BASIS_POINTS = 10000; // For percentage calculations
    
    // State variables
    mapping(string => Booking) public bookings;
    mapping(address => bool) public authorizedOracles;
    mapping(address => bool) public arbiters;
    
    // Events
    event DepositMade(string indexed bookingId, address indexed tourist, address indexed operator, uint256 amount);
    event SLAPassed(string indexed bookingId, address indexed operator);
    event SLAFailed(string indexed bookingId, address indexed tourist);
    event Refunded(string indexed bookingId, address indexed tourist, uint256 amount);
    event PaidOut(string indexed bookingId, address indexed operator, uint256 amount);
    event Disputed(string indexed bookingId, address indexed tourist, address indexed operator);
    event DisputeResolved(string indexed bookingId, bool operatorWins, uint256 amount);
    event OracleAuthorized(address indexed oracle);
    event OracleRevoked(address indexed oracle);
    event ArbiterAuthorized(address indexed arbiter);
    event ArbiterRevoked(address indexed arbiter);
    
    // Modifiers
    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        _;
    }
    
    modifier onlyArbiter() {
        require(arbiters[msg.sender], "Not authorized arbiter");
        _;
    }
    
    modifier bookingExists(string memory bookingId) {
        require(bookings[bookingId].tourist != address(0), "Booking does not exist");
        _;
    }
    
    modifier validBookingStatus(string memory bookingId, BookingStatus requiredStatus) {
        require(bookings[bookingId].status == requiredStatus, "Invalid booking status");
        _;
    }
    
    constructor() {
        // Owner is automatically an arbiter
        arbiters[msg.sender] = true;
    }
    
    /**
     * @dev Create a new booking and deposit ETH
     * @param bookingId Unique identifier for the booking
     * @param operator Tour operator address
     */
    function createBooking(string memory bookingId, address operator) 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(operator != address(0), "Invalid operator address");
        require(operator != msg.sender, "Cannot book with yourself");
        require(bookings[bookingId].tourist == address(0), "Booking ID already exists");
        
        uint256 slaDeadline = block.timestamp + (SLA_TIMEOUT_HOURS * 1 hours);
        
        bookings[bookingId] = Booking({
            tourist: msg.sender,
            operator: operator,
            amount: msg.value,
            depositTime: block.timestamp,
            slaDeadline: slaDeadline,
            status: BookingStatus.Pending,
            slaVerified: false,
            bookingId: bookingId
        });
        
        emit DepositMade(bookingId, msg.sender, operator, msg.value);
    }
    
    /**
     * @dev Verify SLA - can only be called by authorized oracles
     * @param bookingId Booking identifier
     * @param slaPassed Whether the SLA passed or failed
     */
    function verifySLA(string memory bookingId, bool slaPassed) 
        external 
        onlyAuthorizedOracle 
        bookingExists(bookingId)
        validBookingStatus(bookingId, BookingStatus.Pending)
    {
        Booking storage booking = bookings[bookingId];
        require(!booking.slaVerified, "SLA already verified");
        require(block.timestamp <= booking.slaDeadline, "SLA deadline passed");
        
        booking.slaVerified = true;
        
        if (slaPassed) {
            booking.status = BookingStatus.SLAPassed;
            emit SLAPassed(bookingId, booking.operator);
        } else {
            booking.status = BookingStatus.SLAFailed;
            emit SLAFailed(bookingId, booking.tourist);
        }
    }
    
    /**
     * @dev Release funds to operator after SLA passed
     * @param bookingId Booking identifier
     */
    function releaseToOperator(string memory bookingId) 
        external 
        nonReentrant 
        bookingExists(bookingId)
        validBookingStatus(bookingId, BookingStatus.SLAPassed)
    {
        Booking storage booking = bookings[bookingId];
        require(booking.slaVerified, "SLA not verified");
        
        booking.status = BookingStatus.Paid;
        uint256 amount = booking.amount;
        
        (bool success, ) = booking.operator.call{value: amount}("");
        require(success, "Transfer to operator failed");
        
        emit PaidOut(bookingId, booking.operator, amount);
    }
    
    /**
     * @dev Refund to tourist after SLA failed
     * @param bookingId Booking identifier
     */
    function refundToTourist(string memory bookingId) 
        external 
        nonReentrant 
        bookingExists(bookingId)
        validBookingStatus(bookingId, BookingStatus.SLAFailed)
    {
        Booking storage booking = bookings[bookingId];
        require(booking.slaVerified, "SLA not verified");
        
        booking.status = BookingStatus.Refunded;
        uint256 refundAmount = booking.amount;
        
        (bool success, ) = booking.tourist.call{value: refundAmount}("");
        require(success, "Transfer to tourist failed");
        
        emit Refunded(bookingId, booking.tourist, refundAmount);
    }
    
    /**
     * @dev Refund with penalty - operator gets penalty percentage
     * @param bookingId Booking identifier
     */
    function refundWithPenalty(string memory bookingId) 
        external 
        nonReentrant 
        bookingExists(bookingId)
        validBookingStatus(bookingId, BookingStatus.SLAFailed)
    {
        Booking storage booking = bookings[bookingId];
        require(booking.slaVerified, "SLA not verified");
        
        booking.status = BookingStatus.Refunded;
        
        uint256 penaltyAmount = (booking.amount * PENALTY_PERCENTAGE) / BASIS_POINTS;
        uint256 refundAmount = booking.amount - penaltyAmount;
        
        // Send penalty to operator
        if (penaltyAmount > 0) {
            (bool success1, ) = booking.operator.call{value: penaltyAmount}("");
            require(success1, "Penalty transfer to operator failed");
        }
        
        // Send refund to tourist
        if (refundAmount > 0) {
            (bool success2, ) = booking.tourist.call{value: refundAmount}("");
            require(success2, "Refund transfer to tourist failed");
        }
        
        emit Refunded(bookingId, booking.tourist, refundAmount);
        emit PaidOut(bookingId, booking.operator, penaltyAmount);
    }
    
    /**
     * @dev Handle timeout - auto refund if SLA not verified within deadline
     * @param bookingId Booking identifier
     */
    function handleTimeout(string memory bookingId) 
        external 
        nonReentrant 
        bookingExists(bookingId)
        validBookingStatus(bookingId, BookingStatus.Pending)
    {
        Booking storage booking = bookings[bookingId];
        require(block.timestamp > booking.slaDeadline, "SLA deadline not reached");
        require(!booking.slaVerified, "SLA already verified");
        
        booking.status = BookingStatus.Refunded;
        uint256 amount = booking.amount;
        
        (bool success, ) = booking.tourist.call{value: amount}("");
        require(success, "Timeout refund failed");
        
        emit Refunded(bookingId, booking.tourist, amount);
    }
    
    /**
     * @dev Raise a dispute - can be called by tourist or operator
     * @param bookingId Booking identifier
     */
    function raiseDispute(string memory bookingId) 
        external 
        bookingExists(bookingId)
    {
        Booking storage booking = bookings[bookingId];
        require(
            msg.sender == booking.tourist || msg.sender == booking.operator,
            "Only tourist or operator can raise dispute"
        );
        require(
            booking.status == BookingStatus.SLAPassed || 
            booking.status == BookingStatus.SLAFailed,
            "Can only dispute after SLA verification"
        );
        
        booking.status = BookingStatus.Disputed;
        emit Disputed(bookingId, booking.tourist, booking.operator);
    }
    
    /**
     * @dev Resolve dispute - can only be called by arbiters
     * @param bookingId Booking identifier
     * @param operatorWins Whether the operator wins the dispute
     */
    function resolveDispute(string memory bookingId, bool operatorWins) 
        external 
        onlyArbiter 
        nonReentrant 
        bookingExists(bookingId)
        validBookingStatus(bookingId, BookingStatus.Disputed)
    {
        Booking storage booking = bookings[bookingId];
        uint256 amount = booking.amount;
        
        if (operatorWins) {
            booking.status = BookingStatus.Paid;
            (bool success, ) = booking.operator.call{value: amount}("");
            require(success, "Dispute resolution payment failed");
            emit PaidOut(bookingId, booking.operator, amount);
        } else {
            booking.status = BookingStatus.Refunded;
            (bool success, ) = booking.tourist.call{value: amount}("");
            require(success, "Dispute resolution refund failed");
            emit Refunded(bookingId, booking.tourist, amount);
        }
        
        emit DisputeResolved(bookingId, operatorWins, amount);
    }
    
    /**
     * @dev Authorize an oracle address
     * @param oracle Oracle address to authorize
     */
    function authorizeOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Invalid oracle address");
        authorizedOracles[oracle] = true;
        emit OracleAuthorized(oracle);
    }
    
    /**
     * @dev Revoke oracle authorization
     * @param oracle Oracle address to revoke
     */
    function revokeOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = false;
        emit OracleRevoked(oracle);
    }
    
    /**
     * @dev Authorize an arbiter address
     * @param arbiter Arbiter address to authorize
     */
    function authorizeArbiter(address arbiter) external onlyOwner {
        require(arbiter != address(0), "Invalid arbiter address");
        arbiters[arbiter] = true;
        emit ArbiterAuthorized(arbiter);
    }
    
    /**
     * @dev Revoke arbiter authorization
     * @param arbiter Arbiter address to revoke
     */
    function revokeArbiter(address arbiter) external onlyOwner {
        arbiters[arbiter] = false;
        emit ArbiterRevoked(arbiter);
    }
    
    /**
     * @dev Get booking details
     * @param bookingId Booking identifier
     * @return Booking struct
     */
    function getBooking(string memory bookingId) external view returns (Booking memory) {
        require(bookings[bookingId].tourist != address(0), "Booking does not exist");
        return bookings[bookingId];
    }
    
    /**
     * @dev Check if booking has timed out
     * @param bookingId Booking identifier
     * @return bool Whether the booking has timed out
     */
    function isTimedOut(string memory bookingId) external view returns (bool) {
        Booking memory booking = bookings[bookingId];
        return block.timestamp > booking.slaDeadline && !booking.slaVerified;
    }
    
    /**
     * @dev Get time remaining until SLA deadline
     * @param bookingId Booking identifier
     * @return uint256 Seconds remaining until deadline (0 if passed)
     */
    function getTimeRemaining(string memory bookingId) external view returns (uint256) {
        Booking memory booking = bookings[bookingId];
        if (block.timestamp >= booking.slaDeadline) {
            return 0;
        }
        return booking.slaDeadline - block.timestamp;
    }
}
