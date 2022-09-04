# Blockchain Games

[![Build Status](https://app.travis-ci.com/Jonathan-B-Peters/blockchain_games.svg?token=tdEabTLD8uvJAQBpwTu9&branch=main)](https://app.travis-ci.com/Jonathan-B-Peters/blockchain_games)
[![Coveralls](https://img.shields.io/coveralls/github/Jonathan-B-Peters/blockchain_games)](https://coveralls.io/github/Jonathan-B-Peters/blockchain_games)
[![issues](https://img.shields.io/github/issues/Jonathan-B-Peters/blockchain_games)](https://github.com/Jonathan-B-Peters/blockchain_games/issues)

## Objective

This project aims to create a fully decentralized gaming and betting platform. All available games will be turn-based, and implemented entirely on the blockchain as external contracts. Players will be able to challenge any other user to any avaiable game with an optional wager.

## Current Development

The bulk of this decentralized system consists of the contracts responsible for managing outstanding challenges and games currently in-progress. A proxy contract architecture will be used to implement these contracts; players will interface with a single proxy contract which will direct calls to a challenge management contract or a game management contract, depending on the scenario. This will enable admins to upgrade contracts in the future if necessary. Once this system is complete, one or several simple games will be implemented as a proof-of-concept.

## Future Development

Once current development is complete, there are a variety of planned features which  will be implemented:

1. Additional games with more complexity and variety will be implemented.
2. Minting of an NFT using the final game state and wager amount as evidence of a completed game.
3. Support for any user-created game which existing in a smart contract which implements the required interface.
4. Creation of a token which could provide some undetermined benefits (No fees, governance, etc).