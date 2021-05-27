# Overview

The `checkDiff` script compares source code uploaded to Etherscan to source code
on the local machine.

The source code in Etherscan is a concatenation of several files. The script
reads comments inside the files to determine which local files were used, then
it reads the file and reconstructs the expected source code.

The script displays a `diff` between the actual and expected code. The
difference should fall in the following categories:

1. Comments / whitespace
2. The local code has `import` statements not included in Etherscan because the
   files were explicitly concatenated into a master file.
3. The local code has extra `pragma solidity ^0.4.24` statements at the head of
   each file, while Etherscan should have just one at the top.

At the end of the run, `checkDiff` will output which files it was able to
process. <b>Success</b> means that the Etherscan file could be read AND all the
included files could be read. Validity should be determined by actually looking
at the diffs.

# Running checkDiff.js

To run the script, type

`node validate/contractDiff.js <filename1> <filename2> ... <filename3>`

Where the `filename` is the location of source code downloaded from Etherscan.
Copies of `FiatTokenProxy`, `FiatTokenV1`, and `MasterMinter` are included for
testing purposes. You can test them:

`node validate/contractDiff.js validate/FiatTokenProxy.etherscan validate/FiatTokenV1.etherscan validate/MasterMinter.etherscan`

# Finding code on Etherscan

1. Go to [https://etherscan.io](https://etherscan.io)
2. Enter the contract address in the search bar.
3. Click on the `Code` tab.

# Uploading to Etherscan

When uploading source code to Etherscan, you will need to combine several file.
Before the start of an included file, add the comment:

`// File: <pathToFile>`

For example, to include `contracts/Ownable.sol`, add the comment

`// File: contracts/Ownable.sol`

For Open Zeppelin files, omit the `node_modules` directory. For example:

`// File: openzeppelin-solidity/contracts/math/SafeMath.sol`

`// File: zos-lib/contracts/upgradeability/Proxy.sol`
