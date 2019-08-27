#!/usr/bin/env python
import json

if __name__ == '__main__':
  import sys
  if len(sys.argv) < 2:
    print('Usage: {} [path]'.format(sys.argv[0]))
    exit(1)

  path = sys.argv[1]

  characters, stages = None, None
  with open(path + 'characters.json', 'r') as f:
    characters = json.load(f)
  with open(path + 'stages.json', 'r') as f:
    stages = json.load(f)

  # Rebuild the character data
  if characters is not None:
    to_copy = ['name', 'profession', 'rarity', 'appellation']
    filtered_characters = {}
    for id in characters:
      character = characters[id]
      char_copy = {}
      for key in to_copy:
        char_copy[key] = character[key]
      # Copy the phases
      char_copy['phases'] = [
        {'rangeId': p['rangeId']}
        for p in character['phases']
      ]
      filtered_characters[id] = char_copy
    with open(path + 'characters.json', 'w') as f:
      json.dump(filtered_characters, f, indent=2)

  # Rebuild the stages
  if stages is not None:
    to_copy = ['stageId', 'code', 'name', 'difficulty', 'stageType']
    filtered_stages = {}
    for name in stages['stages']:
      stage = stages['stages'][name]
      if stage['stageType'].upper() == u'GUIDE' or \
        stage['stageType'].upper() == u'ACTIVITY':
        continue
      if stage['difficulty'].upper() != u'NORMAL':
        continue
      stage_simple = {}
      for key in to_copy:
        stage_simple[key] = stage[key]
        # Patch the key
        if key == 'stageId':
          if stage_simple[key].startswith('pro_'):
            stage_simple[key] = 'promote_{}'.format(stage_simple[key][4:])
          elif stage_simple[key].startswith('tr_'):
            stage_simple[key] = 'training_{}'.format(int(stage_simple[key][3:]))
          elif stage_simple[key].startswith('wk_kc_'):
            stage_simple[key] = 'weekly_killcost_{}'.format(stage_simple[key][6:])
          elif stage_simple[key].startswith('wk_'):
            stage_simple[key] = 'weekly_{}'.format(stage_simple[key][3:])
      filtered_stages[name] = stage_simple
    with open(path + 'stages.json', 'w') as f:
      json.dump({
        'stages': filtered_stages
      }, f, indent=2)
