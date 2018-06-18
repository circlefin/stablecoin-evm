/* 
 * Copied from openzeppelin v1.10.0 
 * Modificiations: deleted mul, div tests as not needed at time of modification
 * Modifcation date: 6/18/18
 *
*/
import assertJump from '../helpers/assertJump';
const BigNumber = web3.BigNumber;
const SafeMathMock = artifacts.require('SafeMathMock');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SafeMath', () => {
  const MAX_UINT = new BigNumber('115792089237316195423570985008687907853269984665640564039457584007913129639935');

  before(async function () {
    this.safeMath = await SafeMathMock.new();
  });

  describe('add', function () {
    it('adds correctly', async function () {
      const a = new BigNumber(5678);
      const b = new BigNumber(1234);

      const result = await this.safeMath.add(a, b);
      result.should.be.bignumber.equal(a.plus(b));
    });

    it('throws an error on addition overflow', async function () {
      const a = MAX_UINT;
      const b = new BigNumber(1);

      await assertJump(this.safeMath.add(a, b));
    });
  });

  describe('sub', function () {
    it('subtracts correctly', async function () {
      const a = new BigNumber(5678);
      const b = new BigNumber(1234);

      const result = await this.safeMath.sub(a, b);
      result.should.be.bignumber.equal(a.minus(b));
    });

    it('throws an error if subtraction result would be negative', async function () {
      const a = new BigNumber(1234);
      const b = new BigNumber(5678);

      await assertJump(this.safeMath.sub(a, b));
    });
  });
});