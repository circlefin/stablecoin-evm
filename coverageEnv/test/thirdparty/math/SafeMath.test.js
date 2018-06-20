var SafeMath = artifacts.require('SafeMathMock');
var tokenUtils = require('./../../TokenTestUtils');
var BigNumber = require('bignumber.js');
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var expectRevert = tokenUtils.expectRevert;
var expectJump = tokenUtils.expectJump;
const MAX_UINT = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SafeMath', function() {
  beforeEach(async function checkBefore() {
    this.safeMath = await SafeMath.new();
  });

  describe('add', function () {
    it('adds correctly', async function () {
      const a = 5678;
      const b = 1234;

      const result = await this.safeMath.add(a, b);
      assert.isTrue(new BigNumber(result).isEqualTo((new BigNumber(a)).plus(new BigNumber(b))));
    });

    it('throws an error on addition overflow', async function () {
      const a = MAX_UINT;
      const b = 1;

      await expectJump(this.safeMath.add(a, b));
    });
  });

  describe('sub', function () {
    it('subtracts correctly', async function () {
      const a = 5678;
      const b = 1234;

      const result = await this.safeMath.sub(a, b);
      assert.isTrue(new BigNumber(result).isEqualTo((new BigNumber(a)).minus(new BigNumber(b))));
    });

    it('throws an error if subtraction result would be negative', async function () {
      const a = 1234;
      const b = 5678;

      await expectJump(this.safeMath.sub(a, b));
    });
  });
});