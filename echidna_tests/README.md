#Setup

1. Install the full version of
   [solc](http://solidity.readthedocs.io/en/v0.4.24/installing-solidity.html)
   via homebrew (not npm).

2. Clone the echidna repository by running:
   `git submodule add git@github.com:trailofbits/echidna.git`
   `git submodule update --init --recursive` Make sure that the `echidna`
   directory appears in your project root directory. (echidna is included in
   .gitignore)

3. Install stack: `brew install haskell-stack`

4. Run the following commands from inside the echidna directory. Ignore all
   warnings. `stack upgrade` `stack setup` `stack install`

5. If this gives you errors involving 'readline' on MacOS, try running:
   `brew install readline` `brew link readline --force`
   `export LDFLAGS=-L/usr/local/opt/readline/lib`
   `export CPPFLAGS=-I/usr/local/opt/readline/include`
   `stack install readline --extra-include-dirs=/usr/local/opt/readline/include --extra-lib-dirs=/usr/local/opt/readline/lib`
   `stack install`

6. Add `/Users/$(whoami)/.local/bin` to your `PATH` variable:
   `export PATH=$PATH:/Users/$(whoami)/.local/bin`

7. Open `echidna_tests/config.yaml` in a text editor and replace the words
   `REPLACE_WITH_PWD` with the path to the project root directory. To get this
   path, run `echo $PWD`.

8. The echidna_tests suite contains negative and positive test files.

- To run the positive tests, open `config.yaml` and set the field `returnType`
  to `Success`. Then, run the following command from the project root directory:
  `echidna-test echidna_tests/positive.sol Test --config="echidna_tests/config.yaml"`
- To run the negative tests, open `config.yaml` and set the field `returnType`
  to `Fail or Throw`. Then, run the following command from the project root
  directory:
  `echidna-test echidna_tests/negative.sol Test --config="echidna_tests/config.yaml"`
