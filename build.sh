#!/usr/bin/env bash

# Remove existing game data
rm -rf res/

mkdir res
mkdir res/maps/

# Clone the repo with game data
git clone --depth 1 https://github.com/Perfare/ArknightsGameData.git game_data
cp -r game_data/levels/obt/* res/maps

# adjust some names
rm -rf res/maps/camp
mv res/maps/campaign res/maps/camp

# Migrate the configs over
cp game_data/excel/stage_table.json res/stages.json
cp game_data/excel/range_table.json res/range.json
cp game_data/excel/character_table.json res/characters.json

# Post-process the jsons in place
python src/build.py res/

# Cleanup
rm -rf game_data
