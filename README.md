# centre-tokens
Fiat and non-fiat tokens part of the CENTRE network. 

# Setup
Tests need node v8.0.0 or higher, as they depend on async/await functionality. Interacting with eth is very async-y so await makes it much easier to write tests.
Depends on truffle and testrpc for testing.

install truffle:
```npm install -g truffle```

install testrpc:
```npm install -g ethereumjs-testrpc```

install submodules:
```git submodule update --init```

# Testing
testrpc must be running first
```testrpc```

then run the tests via truffle:
```truffle test```

to generate test coverage run:
```npm test```