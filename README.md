<!-- markdownlint-disable -->

## How to run

```sh
npm install
```

- Create a dev-wallet.json file. Ensure SOL has been airdropped to this wallet beforehand.

```sh
solana-keygen new --outfile dev-wallet.json
```

- Run local validator

```sh
solana-test-validator --reset
```

- Run scripts

```sh
npm run transfer
```
