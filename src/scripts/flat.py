import json

def extract_skills_and_recast(json_data):
    recastDelay = {}
    repeat = {}
    for entry in json_data:
        name = entry['name']
        if 'specs' in entry:
            for spec in entry['specs']:
                if 'spellLines' in spec:
                    for spell_line in spec['spellLines']:
                        if 'spellGroups' in spell_line:
                            for spell_group in spell_line['spellGroups']:
                                for skill in spell_group['skills']:
                                    skill_name = skill.get('name', 'Unknown')
                                    recast_delay = None
                                    for attr in skill.get('attributes', []):
                                        if 'Recast Delay' in attr:
                                            recast_delay = attr[1]  # Assuming it's the second item

                                            normalized_recast = 0
                                            if "s" in recast_delay:  # Check if the value is in seconds
                                                normalized_recast = int(float(recast_delay.replace("s", "")))
                                            elif "min" in recast_delay:  # Check if the value is in minutes
                                                minutes, seconds = map(int, recast_delay.replace(" min", "").split(":"))
                                                normalized_recast = minutes * 60 + seconds


                                            # if skill_name == "Stunning Shout":
                                            #     print(name, skill.get('level', '0'))
                                            if skill_name not in recastDelay:
                                                recastDelay[skill_name] = normalized_recast
                                                repeat[skill_name] = 1
                                            else:
                                                if skill_name not in repeat:
                                                    repeat[skill_name] = 1
                                                else:
                                                    repeat[skill_name] += 1
                                                # print("repeat", skill_name)
                                                # if recastDelay[skill_name] != recast_delay:
                                                    # print("differ:", skill_name, name)
                                            # result.append({
                                            #     "skill_name": skill_name,
                                            #     "recast_delay": recast_delay
                                            # })
    counted = 0
    dupes = {}
    for skill, count in repeat.items():
        if count > 1:
            dupes[skill] = count
            counted += 1
    sorted_data = dict(sorted(dupes.items(), key=lambda x: (-x[1], x[0])))
    # print(json.dumps(sorted_data, indent=2))
    
    return recastDelay

with open("charplan_1.0.48.json", "r") as file:
    data = json.load(file)

flattened_data = extract_skills_and_recast(data)

sorted_data = dict(sorted(flattened_data.items(), key=lambda x: (-x[1], x[0])))
# print(json.dumps(sorted_data, indent=2))

cd_list = []
for k,v in sorted_data.items():
    cd_list.append([k,v])

# [
#   ["Bringer of Death", 900],
#   ["Call of the Hounds", 900],
# ]
print(cd_list)