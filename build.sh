#!/usr/bin/env bash

# Clone the repo with game data
git clone --depth 1 https://github.com/Perfare/ArknightsGameData.git game_data
cp -r game_data/levels/obt/* res/

# adjust some names
rm -rf res/camp
mv res/campaign res/camp

# Cleanup
rm -rf game_data
