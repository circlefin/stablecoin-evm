# centre-tokens
Fiat and non-fiat tokens part of the CENTRE network. 

# Setup
Tests need node v8.0.0 or higher, as they depend on async/await functionality. Interacting with eth is very async-y so await makes it much easier to write tests.
Depends on truffle and testrpc for testing.

install npm locally
```npm install```

install truffle:
```npm install -g truffle```

install testrpc:
```npm install -g ethereumjs-testrpc```

install project npm dependencies:
```npm install```

install submodules:
```git submodule update --init```

install chai
```npm install --save-dev chai```
```npm install chai-as-promised```

install babel modules to allow javascript function import/export
npm install babel-polyfill
```npm install --save-dev babel-preset-stage-2```
```npm install --save-dev babel-cli babel-preset-es2015```
```npm install babel-preset-env```

# Testing
testrpc must be running first
```testrpc```

then run the tests via truffle:
```truffle test```

to generate test coverage run:
```npm test```
