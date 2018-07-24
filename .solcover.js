module.exports = {
    port: 8555,
    testrpcOptions: '-p 8555 -d --accounts 15',
    skipFiles: [
        'test/'
    ],
    copyPackages: ['openzeppelin-solidity', 'zos-lib']
};
