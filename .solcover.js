module.exports = {
    port: 8555,
    testrpcOptions: '-p 8555 -d --accounts 16',
    skipFiles: [
        'test/'
    ],
    copyPackages: ['openzeppelin-solidity', 'zos-lib']
};
