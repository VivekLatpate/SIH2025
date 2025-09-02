import { expect } from "chai";
import { ethers } from "hardhat";
import { SafetyEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SafetyEscrow", function () {
  let safetyEscrow: SafetyEscrow;
  let owner: SignerWithAddress;
  let tourist: SignerWithAddress;
  let operator: SignerWithAddress;
  let oracle: SignerWithAddress;
  let arbiter: SignerWithAddress;
  let other: SignerWithAddress;

  const BOOKING_ID = "booking-123";
  const DEPOSIT_AMOUNT = ethers.parseEther("1.0"); // 1 ETH
  const SLA_TIMEOUT_HOURS = 24;
  const PENALTY_PERCENTAGE = 10;

  beforeEach(async function () {
    [owner, tourist, operator, oracle, arbiter, other] = await ethers.getSigners();

    const SafetyEscrow = await ethers.getContractFactory("SafetyEscrow");
    safetyEscrow = await SafetyEscrow.deploy();
    await safetyEscrow.waitForDeployment();

    // Authorize oracle and arbiter
    await safetyEscrow.authorizeOracle(oracle.address);
    await safetyEscrow.authorizeArbiter(arbiter.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await safetyEscrow.owner()).to.equal(owner.address);
    });

    it("Should have correct constants", async function () {
      expect(await safetyEscrow.SLA_TIMEOUT_HOURS()).to.equal(SLA_TIMEOUT_HOURS);
      expect(await safetyEscrow.PENALTY_PERCENTAGE()).to.equal(PENALTY_PERCENTAGE);
    });

    it("Should authorize owner as arbiter by default", async function () {
      expect(await safetyEscrow.arbiters(owner.address)).to.be.true;
    });
  });

  describe("Oracle and Arbiter Management", function () {
    it("Should authorize oracle", async function () {
      await expect(safetyEscrow.authorizeOracle(other.address))
        .to.emit(safetyEscrow, "OracleAuthorized")
        .withArgs(other.address);
      
      expect(await safetyEscrow.authorizedOracles(other.address)).to.be.true;
    });

    it("Should revoke oracle", async function () {
      await safetyEscrow.authorizeOracle(other.address);
      await expect(safetyEscrow.revokeOracle(other.address))
        .to.emit(safetyEscrow, "OracleRevoked")
        .withArgs(other.address);
      
      expect(await safetyEscrow.authorizedOracles(other.address)).to.be.false;
    });

    it("Should authorize arbiter", async function () {
      await expect(safetyEscrow.authorizeArbiter(other.address))
        .to.emit(safetyEscrow, "ArbiterAuthorized")
        .withArgs(other.address);
      
      expect(await safetyEscrow.arbiters(other.address)).to.be.true;
    });

    it("Should revoke arbiter", async function () {
      await safetyEscrow.authorizeArbiter(other.address);
      await expect(safetyEscrow.revokeArbiter(other.address))
        .to.emit(safetyEscrow, "ArbiterRevoked")
        .withArgs(other.address);
      
      expect(await safetyEscrow.arbiters(other.address)).to.be.false;
    });

    it("Should not allow non-owner to authorize oracle", async function () {
      await expect(
        safetyEscrow.connect(tourist).authorizeOracle(other.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Booking Creation", function () {
    it("Should create booking successfully", async function () {
      await expect(
        safetyEscrow.connect(tourist).createBooking(BOOKING_ID, operator.address, {
          value: DEPOSIT_AMOUNT,
        })
      )
        .to.emit(safetyEscrow, "DepositMade")
        .withArgs(BOOKING_ID, tourist.address, operator.address, DEPOSIT_AMOUNT);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.tourist).to.equal(tourist.address);
      expect(booking.operator).to.equal(operator.address);
      expect(booking.amount).to.equal(DEPOSIT_AMOUNT);
      expect(booking.status).to.equal(0); // Pending
      expect(booking.slaVerified).to.be.false;
    });

    it("Should not create booking with zero amount", async function () {
      await expect(
        safetyEscrow.connect(tourist).createBooking(BOOKING_ID, operator.address, {
          value: 0,
        })
      ).to.be.revertedWith("Deposit amount must be greater than 0");
    });

    it("Should not create booking with invalid operator", async function () {
      await expect(
        safetyEscrow.connect(tourist).createBooking(BOOKING_ID, ethers.ZeroAddress, {
          value: DEPOSIT_AMOUNT,
        })
      ).to.be.revertedWith("Invalid operator address");
    });

    it("Should not create booking with same tourist and operator", async function () {
      await expect(
        safetyEscrow.connect(tourist).createBooking(BOOKING_ID, tourist.address, {
          value: DEPOSIT_AMOUNT,
        })
      ).to.be.revertedWith("Cannot book with yourself");
    });

    it("Should not create booking with duplicate ID", async function () {
      await safetyEscrow.connect(tourist).createBooking(BOOKING_ID, operator.address, {
        value: DEPOSIT_AMOUNT,
      });

      await expect(
        safetyEscrow.connect(other).createBooking(BOOKING_ID, operator.address, {
          value: DEPOSIT_AMOUNT,
        })
      ).to.be.revertedWith("Booking ID already exists");
    });
  });

  describe("SLA Verification", function () {
    beforeEach(async function () {
      await safetyEscrow.connect(tourist).createBooking(BOOKING_ID, operator.address, {
        value: DEPOSIT_AMOUNT,
      });
    });

    it("Should verify SLA passed", async function () {
      await expect(safetyEscrow.connect(oracle).verifySLA(BOOKING_ID, true))
        .to.emit(safetyEscrow, "SLAPassed")
        .withArgs(BOOKING_ID, operator.address);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.status).to.equal(1); // SLAPassed
      expect(booking.slaVerified).to.be.true;
    });

    it("Should verify SLA failed", async function () {
      await expect(safetyEscrow.connect(oracle).verifySLA(BOOKING_ID, false))
        .to.emit(safetyEscrow, "SLAFailed")
        .withArgs(BOOKING_ID, tourist.address);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.status).to.equal(2); // SLAFailed
      expect(booking.slaVerified).to.be.true;
    });

    it("Should not allow non-oracle to verify SLA", async function () {
      await expect(
        safetyEscrow.connect(other).verifySLA(BOOKING_ID, true)
      ).to.be.revertedWith("Not authorized oracle");
    });

    it("Should not allow SLA verification after deadline", async function () {
      // Fast forward time past SLA deadline
      await ethers.provider.send("evm_increaseTime", [SLA_TIMEOUT_HOURS * 3600 + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        safetyEscrow.connect(oracle).verifySLA(BOOKING_ID, true)
      ).to.be.revertedWith("SLA deadline passed");
    });

    it("Should not allow double SLA verification", async function () {
      await safetyEscrow.connect(oracle).verifySLA(BOOKING_ID, true);
      
      await expect(
        safetyEscrow.connect(oracle).verifySLA(BOOKING_ID, false)
      ).to.be.revertedWith("SLA already verified");
    });
  });

  describe("Fund Release - SLA Passed", function () {
    beforeEach(async function () {
      await safetyEscrow.connect(tourist).createBooking(BOOKING_ID, operator.address, {
        value: DEPOSIT_AMOUNT,
      });
      await safetyEscrow.connect(oracle).verifySLA(BOOKING_ID, true);
    });

    it("Should release funds to operator", async function () {
      const operatorBalanceBefore = await ethers.provider.getBalance(operator.address);
      
      await expect(safetyEscrow.releaseToOperator(BOOKING_ID))
        .to.emit(safetyEscrow, "PaidOut")
        .withArgs(BOOKING_ID, operator.address, DEPOSIT_AMOUNT);

      const operatorBalanceAfter = await ethers.provider.getBalance(operator.address);
      expect(operatorBalanceAfter - operatorBalanceBefore).to.equal(DEPOSIT_AMOUNT);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.status).to.equal(4); // Paid
    });

    it("Should not release funds if SLA not verified", async function () {
      // Create another booking without SLA verification
      const bookingId2 = "booking-456";
      await safetyEscrow.connect(tourist).createBooking(bookingId2, operator.address, {
        value: DEPOSIT_AMOUNT,
      });

      await expect(
        safetyEscrow.releaseToOperator(bookingId2)
      ).to.be.revertedWith("SLA not verified");
    });
  });

  describe("Fund Refund - SLA Failed", function () {
    beforeEach(async function () {
      await safetyEscrow.connect(tourist).createBooking(BOOKING_ID, operator.address, {
        value: DEPOSIT_AMOUNT,
      });
      await safetyEscrow.connect(oracle).verifySLA(BOOKING_ID, false);
    });

    it("Should refund full amount to tourist", async function () {
      const touristBalanceBefore = await ethers.provider.getBalance(tourist.address);
      
      await expect(safetyEscrow.refundToTourist(BOOKING_ID))
        .to.emit(safetyEscrow, "Refunded")
        .withArgs(BOOKING_ID, tourist.address, DEPOSIT_AMOUNT);

      const touristBalanceAfter = await ethers.provider.getBalance(tourist.address);
      expect(touristBalanceAfter - touristBalanceBefore).to.equal(DEPOSIT_AMOUNT);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.status).to.equal(3); // Refunded
    });

    it("Should refund with penalty", async function () {
      const touristBalanceBefore = await ethers.provider.getBalance(tourist.address);
      const operatorBalanceBefore = await ethers.provider.getBalance(operator.address);
      
      const penaltyAmount = (DEPOSIT_AMOUNT * BigInt(PENALTY_PERCENTAGE)) / BigInt(10000);
      const refundAmount = DEPOSIT_AMOUNT - penaltyAmount;

      await expect(safetyEscrow.refundWithPenalty(BOOKING_ID))
        .to.emit(safetyEscrow, "Refunded")
        .withArgs(BOOKING_ID, tourist.address, refundAmount)
        .and.to.emit(safetyEscrow, "PaidOut")
        .withArgs(BOOKING_ID, operator.address, penaltyAmount);

      const touristBalanceAfter = await ethers.provider.getBalance(tourist.address);
      const operatorBalanceAfter = await ethers.provider.getBalance(operator.address);
      
      expect(touristBalanceAfter - touristBalanceBefore).to.equal(refundAmount);
      expect(operatorBalanceAfter - operatorBalanceBefore).to.equal(penaltyAmount);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.status).to.equal(3); // Refunded
    });
  });

  describe("Timeout Handling", function () {
    beforeEach(async function () {
      await safetyEscrow.connect(tourist).createBooking(BOOKING_ID, operator.address, {
        value: DEPOSIT_AMOUNT,
      });
    });

    it("Should handle timeout and auto-refund", async function () {
      // Fast forward time past SLA deadline
      await ethers.provider.send("evm_increaseTime", [SLA_TIMEOUT_HOURS * 3600 + 1]);
      await ethers.provider.send("evm_mine", []);

      const touristBalanceBefore = await ethers.provider.getBalance(tourist.address);
      
      await expect(safetyEscrow.handleTimeout(BOOKING_ID))
        .to.emit(safetyEscrow, "Refunded")
        .withArgs(BOOKING_ID, tourist.address, DEPOSIT_AMOUNT);

      const touristBalanceAfter = await ethers.provider.getBalance(tourist.address);
      expect(touristBalanceAfter - touristBalanceBefore).to.equal(DEPOSIT_AMOUNT);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.status).to.equal(3); // Refunded
    });

    it("Should not handle timeout before deadline", async function () {
      await expect(
        safetyEscrow.handleTimeout(BOOKING_ID)
      ).to.be.revertedWith("SLA deadline not reached");
    });

    it("Should not handle timeout if SLA already verified", async function () {
      await safetyEscrow.connect(oracle).verifySLA(BOOKING_ID, true);
      
      // Fast forward time past SLA deadline
      await ethers.provider.send("evm_increaseTime", [SLA_TIMEOUT_HOURS * 3600 + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        safetyEscrow.handleTimeout(BOOKING_ID)
      ).to.be.revertedWith("SLA already verified");
    });
  });

  describe("Dispute Resolution", function () {
    beforeEach(async function () {
      await safetyEscrow.connect(tourist).createBooking(BOOKING_ID, operator.address, {
        value: DEPOSIT_AMOUNT,
      });
      await safetyEscrow.connect(oracle).verifySLA(BOOKING_ID, true);
    });

    it("Should allow tourist to raise dispute", async function () {
      await expect(safetyEscrow.connect(tourist).raiseDispute(BOOKING_ID))
        .to.emit(safetyEscrow, "Disputed")
        .withArgs(BOOKING_ID, tourist.address, operator.address);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.status).to.equal(5); // Disputed
    });

    it("Should allow operator to raise dispute", async function () {
      await expect(safetyEscrow.connect(operator).raiseDispute(BOOKING_ID))
        .to.emit(safetyEscrow, "Disputed")
        .withArgs(BOOKING_ID, tourist.address, operator.address);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.status).to.equal(5); // Disputed
    });

    it("Should not allow others to raise dispute", async function () {
      await expect(
        safetyEscrow.connect(other).raiseDispute(BOOKING_ID)
      ).to.be.revertedWith("Only tourist or operator can raise dispute");
    });

    it("Should resolve dispute in favor of operator", async function () {
      await safetyEscrow.connect(tourist).raiseDispute(BOOKING_ID);
      
      const operatorBalanceBefore = await ethers.provider.getBalance(operator.address);
      
      await expect(safetyEscrow.connect(arbiter).resolveDispute(BOOKING_ID, true))
        .to.emit(safetyEscrow, "DisputeResolved")
        .withArgs(BOOKING_ID, true, DEPOSIT_AMOUNT)
        .and.to.emit(safetyEscrow, "PaidOut")
        .withArgs(BOOKING_ID, operator.address, DEPOSIT_AMOUNT);

      const operatorBalanceAfter = await ethers.provider.getBalance(operator.address);
      expect(operatorBalanceAfter - operatorBalanceBefore).to.equal(DEPOSIT_AMOUNT);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.status).to.equal(4); // Paid
    });

    it("Should resolve dispute in favor of tourist", async function () {
      await safetyEscrow.connect(tourist).raiseDispute(BOOKING_ID);
      
      const touristBalanceBefore = await ethers.provider.getBalance(tourist.address);
      
      await expect(safetyEscrow.connect(arbiter).resolveDispute(BOOKING_ID, false))
        .to.emit(safetyEscrow, "DisputeResolved")
        .withArgs(BOOKING_ID, false, DEPOSIT_AMOUNT)
        .and.to.emit(safetyEscrow, "Refunded")
        .withArgs(BOOKING_ID, tourist.address, DEPOSIT_AMOUNT);

      const touristBalanceAfter = await ethers.provider.getBalance(tourist.address);
      expect(touristBalanceAfter - touristBalanceBefore).to.equal(DEPOSIT_AMOUNT);

      const booking = await safetyEscrow.getBooking(BOOKING_ID);
      expect(booking.status).to.equal(3); // Refunded
    });

    it("Should not allow non-arbiter to resolve dispute", async function () {
      await safetyEscrow.connect(tourist).raiseDispute(BOOKING_ID);
      
      await expect(
        safetyEscrow.connect(other).resolveDispute(BOOKING_ID, true)
      ).to.be.revertedWith("Not authorized arbiter");
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      await safetyEscrow.connect(tourist).createBooking(BOOKING_ID, operator.address, {
        value: DEPOSIT_AMOUNT,
      });
    });

    it("Should check if booking is timed out", async function () {
      expect(await safetyEscrow.isTimedOut(BOOKING_ID)).to.be.false;
      
      // Fast forward time past SLA deadline
      await ethers.provider.send("evm_increaseTime", [SLA_TIMEOUT_HOURS * 3600 + 1]);
      await ethers.provider.send("evm_mine", []);
      
      expect(await safetyEscrow.isTimedOut(BOOKING_ID)).to.be.true;
    });

    it("Should get time remaining", async function () {
      const timeRemaining = await safetyEscrow.getTimeRemaining(BOOKING_ID);
      expect(timeRemaining).to.be.greaterThan(0);
      expect(timeRemaining).to.be.lessThanOrEqual(SLA_TIMEOUT_HOURS * 3600);
    });

    it("Should return 0 time remaining after deadline", async function () {
      // Fast forward time past SLA deadline
      await ethers.provider.send("evm_increaseTime", [SLA_TIMEOUT_HOURS * 3600 + 1]);
      await ethers.provider.send("evm_mine", []);
      
      const timeRemaining = await safetyEscrow.getTimeRemaining(BOOKING_ID);
      expect(timeRemaining).to.equal(0);
    });

    it("Should not get booking that doesn't exist", async function () {
      await expect(
        safetyEscrow.getBooking("non-existent")
      ).to.be.revertedWith("Booking does not exist");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple bookings correctly", async function () {
      const bookingId1 = "booking-1";
      const bookingId2 = "booking-2";
      
      await safetyEscrow.connect(tourist).createBooking(bookingId1, operator.address, {
        value: DEPOSIT_AMOUNT,
      });
      
      await safetyEscrow.connect(other).createBooking(bookingId2, operator.address, {
        value: DEPOSIT_AMOUNT,
      });
      
      const booking1 = await safetyEscrow.getBooking(bookingId1);
      const booking2 = await safetyEscrow.getBooking(bookingId2);
      
      expect(booking1.tourist).to.equal(tourist.address);
      expect(booking2.tourist).to.equal(other.address);
      expect(booking1.amount).to.equal(DEPOSIT_AMOUNT);
      expect(booking2.amount).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should handle zero penalty correctly", async function () {
      // Create a booking with very small amount to test edge case
      const smallAmount = ethers.parseEther("0.001");
      await safetyEscrow.connect(tourist).createBooking(BOOKING_ID, operator.address, {
        value: smallAmount,
      });
      
      await safetyEscrow.connect(oracle).verifySLA(BOOKING_ID, false);
      
      // With very small amount, penalty might be 0 due to rounding
      const touristBalanceBefore = await ethers.provider.getBalance(tourist.address);
      const operatorBalanceBefore = await ethers.provider.getBalance(operator.address);
      
      await safetyEscrow.refundWithPenalty(BOOKING_ID);
      
      const touristBalanceAfter = await ethers.provider.getBalance(tourist.address);
      const operatorBalanceAfter = await ethers.provider.getBalance(operator.address);
      
      // Total should equal original amount
      const totalRefunded = (touristBalanceAfter - touristBalanceBefore) + 
                           (operatorBalanceAfter - operatorBalanceBefore);
      expect(totalRefunded).to.equal(smallAmount);
    });
  });
});
