# centre-tokens
Fiat and non-fiat tokens part of the CENTRE network. 

# Setup
Tests need node v8.0.0 or higher, as they depend on async/await functionality. Interacting with eth is very async-y so await makes it much easier to write tests.
Depends on truffle and testrpc for testing.

install truffle:
```npm install -g truffle```

install ganache-cli:
```npm install -g ganache-cli```

install project npm dependencies:
```npm install```

install submodules:
```git submodule update --init```

# Testing
ganache-cli (Ethereum RPC client) must be running first
```ganache-cli --defaultBalanceEther 1000000 --deterministic```

then run the tests via truffle:
```truffle test```

or run a specific file of tests with:
```truffle test [file]```

to generate test coverage run:
```npm test```


# Submodules
Open Zeppelin is included as a submodule, however AWS codebuild doesn't play nice with submodules so we have to include the specific commit in `buildspec.yaml` as well. Whenever we update the sumbodule we also have to update the hash in `buildspec.yaml` for the build to pick it up. Hopeully amazon will support submodules at some point in the near future.
