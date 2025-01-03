const { app, BrowserWindow, dialog, ipcMain, globalShortcut  } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

require("electron-reload")(__dirname)

let mainWindow;
let dpsTimeStart = 0;
let dpsTimeEnd= 0;
let damageOut = 0;
let damageInc = 0;
let healTimeStart = 0;
let healTimeEnd;
let damageIncTimeStart = 0;
let damageIncTimeEnd;
let heals = 0;
let iheals = 0;

let damageMap = new Map();
let spellDamageMap = new Map();
let damageIncMap = new Map();
let healMap = new Map();
let ihealMap = new Map();
let healTargetMap = new Map();
let meleeDamageMap = new Map();
let combinedMap = new Map();

const spellMap = new Map([['Bringer of Death', 900], ['Call of the Hounds', 900], ['Beautified Remedy', 600], ["Bith's Acclaimation", 600], ["Bith's Benediction", 600], ["Bith's Benison", 600], ['Bursting Ivy', 600], ['Bursting Tangleweed', 600], ['Bursting Thornweed', 600], ['Bursting Undergrowth', 600], ['Bursting Vines', 600], ['Chain Lightning', 600], ['Choking Undergrowth', 600], ['Deluding Harmony', 600], ["Eir's Glorious Touch", 600], ["Eir's Heavenly Touch", 600], ["Eir's Magnificent Touch", 600], ['Entrancing Harmony', 600], ['Epiphany', 600], ['Forest Phantom', 600], ['Forest Shadow', 600], ['Forest Spirit', 600], ['Fury of Nature', 600], ['Glorious Remedy', 600], ['Greater Forest Shadow', 600], ['Greater Forest Spirit', 600], ['Hypnotic Harmony', 600], ['Inflexible Armor', 600], ['Magnificent Remedy', 600], ['Pacifying Gaze', 600], ['Pacifying Glance', 600], ['Pacifying Glare', 600], ['Paralyzing Gaze', 600], ['Paralyzing Glance', 600], ['Paralyzing Glare', 600], ['Rigid Armor', 600], ['Sprouting Undergrowth', 600], ['Tightening Armor', 600], ['Unbending Armor', 600], ['Unyielding Armor', 600], ['Blessing of the Night', 450], ['Blessing of the Heavens', 300], ['Blight Burst', 300], ['Boon from Eir', 300], ['Boon of the Heavens', 300], ['Disconcerting Yell', 300], ['Dispensation from Eir', 300], ['Favor from Eir', 300], ['Favor of the Heavens', 300], ['Gift of the Heavens', 300], ['Greater Burden', 300], ['Heavenly Dreams', 300], ['Heavenly Images', 300], ['Heavenly Imagination', 300], ['Heavenly Mirage', 300], ['Heavenly Visions', 300], ['Lesser Burden', 300], ['Lesser Deliverance', 300], ['Major Deliverance', 300], ['Minor Burden', 300], ['Minor Deliverance', 300], ['Modest Burden', 300], ["Nature's Appreciation", 300], ["Nature's Blessing", 300], ["Nature's Esteem", 300], ["Nature's Sanction", 300], ['Overwhelming Burden', 300], ['Redeem from Valhalla', 300], ['Reincarnate', 300], ['Swift Reconstitution', 300], ['Theophany', 300], ['Tribute from Eir', 300], ["Valkryie's Command", 300], ['Vindictive Nip', 300], ['Petrifying Cry ', 240], ['Alacrity of the Angel', 180], ['Alacrity of the Archangel', 180], ['Alacrity of the Heavenly Host', 180], ['Haste of the Angel', 180], ['Haste of the Archangel', 180], ['Speed of the Angel', 180], ['Speed of the Archangel', 180], ['Unnerving Bellow ', 180], ['Surge of Cataclysm', 150], ['Surge of Destruction', 150], ['Surge of Infliction', 150], ['Surge of Maiming', 150], ['Surge of Mutilation', 150], ['Surge of Ruin', 150], ['Surge of Wrecking', 150], ['Alacrity of Kudzu', 120], ['Celerity of Kudzu', 120], ['Chilling Shriek ', 120], ['Haste of Kudzu', 120], ["Hunter's Ally", 120], ["Hunter's Avatar", 120], ["Hunter's Companion", 120], ["Hunter's Elder Avatar", 120], ["Hunter's Elder Protector", 120], ["Hunter's Pet", 120], ["Hunter's Protector", 120], ['Pace of Kudzu', 120], ['Rampant Speed', 120], ['Rushing Kudzu', 120], ['Speed of Kudzu', 120], ['Chilling Ground', 90], ['Decrepit Ground', 90], ['Desecrated Ground', 90], ['Enchanted Ground', 90], ['Freezing Ground', 90], ['Frigid Ground', 90], ['Icy Ground', 90], ['Ignore Debilitation', 90], ['Ignore Depletion', 90], ['Ignore Impunities', 90], ['Ignore Infirmity', 90], ['Ignore Weakness', 90], ['Infused Ground', 90], ['Majestic Ground', 90], ['Mystic Ground', 90], ['Numbing Ground', 90], ['Rotting Ground', 90], ['Spellbound Ground', 90], ['Unholy Ground', 90], ['Wretched Ground', 90], ['Awareness of Magic', 60], ['Blood Curdling Scream', 60], ['Call of the Raven', 60], ['Chilling Tendrils', 60], ['Constricting Exhaustion', 60], ['Cooling Tendrils', 60], ['Crippling Exhaustion', 60], ['Debilitating Exhaustion', 60], ['Disabling Exhaustion', 60], ['Expectancy of Magic', 60], ['Freezing Grasp', 60], ['Freezing Hold', 60], ['Freezing Tendrils', 60], ['Frosting Tendrils', 60], ['Grasping Creepers', 60], ['Grasping Ivy', 60], ['Grasping Tangleweed', 60], ['Grasping Tendrils', 60], ['Grasping Thornweed', 60], ['Ice Bracelet', 60], ['Ice Cable', 60], ['Ice Chain', 60], ['Numbing Tendrils', 60], ["Nurizane's Blinding Cyclone", 60], ["Nurizane's Blinding Gale", 60], ["Nurizane's Blinding Wind", 60], ['Sense of Magic', 60], ['Shatter Empowerment', 60], ['Snaring Exhaustion', 60], ['Soul of Magic', 60], ["Valkryie's Dominance", 60], ['Vengeance of the Raven', 60], ['Vindictive Bite', 60], ['Way of Magic', 60], ['Wrath of the Raven', 60], ['Demand Awe', 45], ['Demand Respect', 45], ['Demand Reverence', 45], ["Perizor's Disarming Bash", 45], ["Perizor's Disarming Blow", 45], ["Perizor's Disarming Strike", 45], ["Acolyte's Redemption", 30], ['Annoy', 30], ['Blessing of Nethuni', 30], ['Brazen Stand', 30], ['Bursting Embers', 30], ['Cant of Befuddling', 30], ['Cant of Bewilderment', 30], ['Cant of Confusion', 30], ['Cant of Discord', 30], ['Cant of Perplexity', 30], ["Chaplain's Redemption", 30], ['Clouded Agony', 30], ['Clouded Destruction', 30], ['Clouded Distress', 30], ['Clouded Pain', 30], ['Crippling Shout', 30], ['Dead Flesh Living', 30], ['Disabling Shout', 30], ['Facilitate Painworking', 30], ["Fanatic's Redemption", 30], ['Flaming Embers', 30], ['Flickering Embers', 30], ['Freezing Clench', 30], ['Freezing Terror', 30], ['Gift of Nethuni', 30], ['Grace of Nethuni', 30], ['Heated Embers', 30], ['Imbue the Abyss', 30], ['Impress Ambiguity', 30], ['Impress Amnesia', 30], ['Impress Confusion', 30], ['Impress Dread ', 30], ['Incapacitating Shout', 30], ['Incense', 30], ['Incinerating Embers', 30], ['Inflame', 30], ["Inquisitor's Redemption", 30], ['Irreverent Gesture', 30], ['Last Stand', 30], ["Lesser Nature's Favor", 30], ["Lesser Nature's Gift", 30], ["Lesser Nature's Token", 30], ['Molten Embers', 30], ["Nature's Bane", 30], ["Nature's Blight", 30], ["Nature's Curator", 30], ["Nature's Deacon", 30], ["Nature's Decay", 30], ["Nature's Favor", 30], ["Nature's Gift", 30], ["Nature's Ill", 30], ["Nature's Keeper", 30], ["Nature's Nausea", 30], ["Nature's Poison", 30], ["Nature's Rot", 30], ["Nature's Sentinel", 30], ["Nature's Steward", 30], ["Nature's Token", 30], ["Nature's Toxin", 30], ["Nature's Venom", 30], ["Nethuni's Recuperating Waters", 30], ["Nethuni's Refreshing Waters", 30], ["Nethuni's Renewing Waters", 30], ["Odin's Grasp", 30], ["Odin's Lock", 30], ["Odin's Restraint", 30], ["Odin's Restriction", 30], ['Paralyzing Shout', 30], ['Power Vortex', 30], ["Prophet's Conviction", 30], ["Prophet's Dogma", 30], ["Prophet's Faith", 30], ["Prophet's Fidelity", 30], ["Prophet's Penitence", 30], ["Prophet's Piety", 30], ['Regenerate Blood', 30], ['Regenerate Body', 30], ['Regenerate Flesh', 30], ['Regenerate Muscle', 30], ['Smoldering Embers', 30], ['Soul Bane', 30], ['Soul Blight', 30], ['Soul Poison', 30], ['Soul Toxin', 30], ['Soul Venom', 30], ['Spirit Decay', 30], ['Spirit Ill', 30], ['Spirit Rot', 30], ['Spirit Wrench', 30], ['Stoic Stand', 30], ['Tease', 30], ["Valhalla's Contempt", 30], ["Valhalla's Despite", 30], ["Valhalla's Disdain", 30], ["Valhalla's Rage", 30], ["Valhalla's Scorn", 30], ['Vampiiric Awareness ', 30], ['Vampiiric Senses', 30], ['Vampiiric Sight', 30], ['Volley 1', 30], ['Volley 3', 30], ['Volley 4', 30], ['Volley 5', 30], ['Volley 6', 30], ['Volley 7', 30], ['Volley 8', 30], ["Zealot's Redemption", 30], ['Abrogation Bolt', 20], ['Aggravate', 20], ['Annihilate Evil', 20], ['Annihilation Bolt', 20], ['Arrow of Night', 20], ['Atony', 20], ['Banish Evil', 20], ['Bolt of Death', 20], ['Bolt of Destruction', 20], ['Bolt of Healing', 20], ['Bolt of Lava', 20], ['Bolt of Lava (Enhanced)', 20], ['Bolt of Mending', 20], ['Bolt of Renewal', 20], ['Bolt of Uncreation', 20], ['Capitulation', 20], ['Close Path', 20], ['Compel Captulation', 20], ['Compel Defeat', 20], ['Compel Resignation', 20], ['Compel Submission', 20], ['Compel Surrender', 20], ['Conceal Path', 20], ['Crawl', 20], ['Curse of Crawling', 20], ['Curse of Languishing', 20], ['Curse of Lumbering', 20], ['Curse of Slowness', 20], ['Curse of Sluggishness', 20], ['Cursed Annihilation', 20], ['Cursed Blast', 20], ['Cursed Bomb', 20], ['Cursed Burst', 20], ['Cursed Destruction', 20], ['Cursed Devastation', 20], ['Cursed Explosion', 20], ['Cursed Mortar', 20], ['Cursed Ruination', 20], ['Dagger of Night', 20], ['Darken Path', 20], ['Dart of Night', 20], ['Deafening Cascade', 20], ['Debility', 20], ['Demoralization', 20], ['Disguise Path', 20], ['Dispel Evil', 20], ['Drive Evil', 20], ['Ear-splitting Cascade', 20], ['Energy Siphon', 20], ['Enervation', 20], ['Enrage', 20], ['Essence Siphon', 20], ['Explosive Orb', 20], ['Explosive Orb (Major)', 20], ['Explosive Orb (Minor)', 20], ['Fiery Bolt', 20], ['Fiery Grapple', 20], ['Fiery Grasp', 20], ['Fiery Leglock', 20], ['Fiery Stranglehold', 20], ['Fiery Tangle', 20], ['Fiery Wrap', 20], ['Fire Bolt', 20], ['Fire Streak', 20], ['Fireball', 20], ['Flame Spear', 20], ['Flame Streak', 20], ['Flaming Rock', 20], ['Flaming Rocks (Greater)', 20], ['Flaming Rocks (Major)', 20], ['Flaming Rocks (Minor)', 20], ['Freezing Howl', 20], ['Fungal Barb', 20], ['Fungal Bramble', 20], ['Fungal Burr', 20], ['Fungal Needle', 20], ['Fungal Pin', 20], ['Fungal Spear', 20], ['Fungal Spike', 20], ['Fungal Spine', 20], ['Fungal Spur', 20], ['Fungal Thistle', 20], ['Fungal Thorn', 20], ['Greater Atony', 20], ['Greater Bolt of Death', 20], ['Greater Bolt of Destruction', 20], ['Greater Bolt of Havoc', 20], ['Greater Bolt of Ruin', 20], ['Greater Capitulation', 20], ['Greater Debility', 20], ['Greater Demoralization', 20], ['Greater Enervation', 20], ['Greater Infirmity', 20], ['Greater Resignation', 20], ['Greater Runebolt', 20], ['Greater Submission', 20], ['Greater Surrender', 20], ['Greater Thunder Bellow', 20], ['Greater Thunder Howl', 20], ['Greater Thunder Roar', 20], ['Greater Thunder Shout', 20], ['Health Siphon', 20], ['Hexed Bonding Root', 20], ['Hexed Clutching Root', 20], ['Hexed Detaining Root', 20], ['Hexed Grasping Root', 20], ['Hexed Holding Root', 20], ['Hexed Tangling Root', 20], ['Hexed Tenacious Root', 20], ['Hexed Webbing Root', 20], ['Hide Path', 20], ['Humming Spike', 20], ['Incendiary Lance', 20], ['Infirmity', 20], ['Infurating Gesture', 20], ['Infuriate', 20], ['Insulting Gesture', 20], ['Irreverant Gesture', 20], ['Knife of Night', 20], ['Lance of Night', 20], ['Languor', 20], ['Lava Force', 20], ['Lava Force (Enhanced)', 20], ['Lava Streak', 20], ['Lava Streak (Enhanced)', 20], ['Lava Strike', 20], ['Lava Strike (Enhanced)', 20], ["Lava's Fury", 20], ['Lesser Bolt of Death', 20], ['Lesser Bolt of Destruction', 20], ['Lesser Bolt of Havoc', 20], ['Lesser Bolt of Healing', 20], ['Lesser Bolt of Mending', 20], ['Lesser Bolt of Renewal', 20], ['Lesser Bolt of Ruin', 20], ['Lesser Demoralization', 20], ['Lesser Runebolt', 20], ['Lesser Sigil of Destruction', 20], ['Lesser Sigil of Devastation', 20], ['Lesser Sigil of Havoc', 20], ['Lesser Sigil of Ruin', 20], ['Lesser Sigil of Undoing', 20], ['Life Siphon', 20], ['Lumber', 20], ['Major Demoralization', 20], ['Major Runebolt', 20], ['Mask Path', 20], ['Minor Demoralization', 20], ['Minor Fire Streak', 20], ['Minor Flame Spear', 20], ['Minor Flame Streak', 20], ['Minor Incendiary Lance', 20], ['Minor Runebolt', 20], ['Negative Bolt', 20], ['Nil Bolt', 20], ['Null Bolt', 20], ['Obliteration Bolt', 20], ['Oblivion Bolt', 20], ['Obscure Path', 20], ["Odin's Claw", 20], ["Odin's Greater Claw", 20], ["Odin's Greater Hoof", 20], ["Odin's Greater Horn", 20], ["Odin's Greater Ram", 20], ["Odin's Heel", 20], ["Odin's Hoof", 20], ["Odin's Horn", 20], ["Odin's Ram", 20], ['Piercing Cascade', 20], ['Power Absorb', 20], ['Power Drain', 20], ['Power Leech', 20], ['Power Shot 1', 20], ['Power Shot 2', 20], ['Power Shot 3', 20], ['Power Shot 4', 20], ['Power Shot 5', 20], ['Power Shot 6', 20], ['Power Shot 7', 20], ['Power Shot 8', 20], ['Power Siphon', 20], ['Power Vacuum', 20], ['Provoke', 20], ['Puissance Siphon', 20], ['Rapier of Night', 20], ['Reign of Fire', 20], ['Reign of Fire (Major)', 20], ['Reign of Fire (Minor)', 20], ['Repel Evil', 20], ['Repulse Evil', 20], ['Resignation', 20], ['Rude Gesture', 20], ['Runebolt', 20], ['Screaming Cascade', 20], ['Shattering Cascade', 20], ['Shrieking Cascade', 20], ['Sigil of Destruction', 20], ['Sigil of Devastation', 20], ['Sigil of Havoc', 20], ['Sigil of Ruin', 20], ['Sigil of Undoing', 20], ['Simple Runebolt', 20], ['Slowness', 20], ['Sluggishness', 20], ['Soul Siphon', 20], ['Sovereign Runebolt', 20], ['Spear of Night', 20], ['Spirit Siphon', 20], ['Stiletto of Night', 20], ['Stunning Yell', 20], ['Submission', 20], ['Superior Demoralization', 20], ['Superior Runebolt', 20], ['Supreme Runebolt', 20], ['Surrender', 20], ['Thunder Bellow', 20], ['Thunder Howl', 20], ['Thunder Roar', 20], ['Thunder Shout', 20], ['Thunderous Burst', 20], ['Thunderous Burst (Major)', 20], ['Thunderous Burst (Minor)', 20], ["Toothgnasher's Bite", 20], ["Toothgnasher's Hoof", 20], ["Toothgnasher's Horn", 20], ["Toothgnasher's Ram", 20], ["Toothgrinder's Bite", 20], ["Toothgrinder's Hoof", 20], ["Toothgrinder's Horn", 20], ["Toothgrinder's Ram", 20], ['Ultimate Demoralization', 20], ['Veil Path', 20], ['Veil of Apprehension', 20], ['Veil of Doubt', 20], ['Veil of Hesitation', 20], ['Veil of Indecision', 20], ['Veil of Uncertainty', 20], ['Vigor Siphon', 20], ['Vitality Siphon', 20], ['Void Abyss', 20], ['Void Bolt', 20], ['Void Break', 20], ['Void Chasm', 20], ['Void Cleave', 20], ['Void Fissure', 20], ['Void Gap', 20], ['Void Gulf', 20], ['Void Rent', 20], ['Void Rift', 20], ['Void Slit', 20], ['Wailing Cascade', 20], ['Whirring Spike', 20], ['Avert Attack', 15], ['Avert Magic ', 15], ['Battle Howl', 15], ['Battle Roar', 15], ['Battle Scream', 15], ['Battle Shout', 15], ['Battle Whoop', 15], ['Blast of Boldness', 15], ['Blast of Bravery', 15], ['Blast of Courage', 15], ['Blast of Defiance', 15], ['Blast of Galliance', 15], ['Blast of Heroism', 15], ['Blast of Valiance', 15], ['Blast of the Champion', 15], ['Burdening Embrace', 15], ['Burdening Grasp of Februstos', 15], ['Cacophony', 15], ['Cancel Defenses', 15], ['Concussive Bellow', 15], ['Concussive Holler', 15], ['Concussive Roar', 15], ['Concussive Scream', 15], ['Concussive Shout', 15], ['Concussive Shriek', 15], ['Concussive Wail', 15], ['Concussive Whoop', 15], ['Concussive Yell', 15], ['Darkened Alacrity', 15], ['Darkened Haste', 15], ['Darkened Quickness', 15], ['Darkened Swiftness', 15], ['Darkened Urgency', 15], ['Deafening Cacophony', 15], ['Death Blast', 15], ['Deflect Attack', 15], ['Deflect Magic ', 15], ['Destroy Defenses', 15], ['Destroy Magic ', 15], ['Deter Attack', 15], ['Diminishing Bellow', 15], ['Diminishing Cadence', 15], ['Diminishing Scream', 15], ['Diminishing Screech', 15], ['Diminishing Shriek', 15], ['Diminishing Wail', 15], ['Diminishing Yell', 15], ['Dischordant Howl', 15], ['Dischordant Note', 15], ['Dischordant Shriek', 15], ['Dischordant Tone', 15], ['Dischordant Wail', 15], ['Divert Attack', 15], ['Draining Embrace', 15], ['Draining Grasp of Februstos', 15], ['Dulling Embrace', 15], ['Dulling Grasp of Februstos', 15], ['Enervating Embrace', 15], ['Enervating Grasp of Februstos', 15], ['Essence Blast', 15], ['Exhausting Embrace', 15], ['Exhausting Grasp of Februstos', 15], ['Fatiguing Embrace', 15], ['Fatiguing Grasp of Februstos', 15], ['Final Blast', 15], ['Focus Blast', 15], ['Foil Attack', 15], ['Force', 15], ['Fortified Skin', 15], ['Gift of Foresight', 15], ['Gift of Form', 15], ['Gift of Precision', 15], ['Gift of Renewal', 15], ['Greater Cacophony', 15], ['Greater Force', 15], ['Greater Gift of Foresight', 15], ['Greater Regeneration', 15], ['Greater Renewal', 15], ['Grueling Embrace', 15], ['Grueling Grasp of Februstos', 15], ['Hardened Skin', 15], ['Impenetrable Skin', 15], ['Impervious Skin', 15], ['Lesser Cacophony', 15], ['Lesser Gift of Foresight', 15], ['Major Cacophony', 15], ['Major Force', 15], ['Major Gift of Foresight', 15], ['Maximum Force', 15], ['Minor Force', 15], ['Minor Gift of Foresight', 15], ['Negate Attack', 15], ['Negate Defenses', 15], ['Negate Magic ', 15], ["Odin's Amelioration", 15], ["Odin's Emendation", 15], ["Odin's Purification", 15], ["Odin's Reconstruction", 15], ["Odin's Recovery", 15], ["Odin's Reparation", 15], ["Odin's Restoration", 15], ['Perfect Gift of Foresight', 15], ['Perfection of Form', 15], ['Perfection of Method', 15], ['Perfection of Style', 15], ['Power Blast', 15], ['Recuperation', 15], ['Regeneration', 15], ['Remove Defenses', 15], ['Renewal', 15], ['Resist Attack', 15], ['Resist Magic ', 15], ['Restoration', 15], ['Screeching Howl', 15], ['Screeching Note', 15], ['Screeching Scream', 15], ['Screeching Shout', 15], ['Screeching Tone', 15], ['Self Destruction', 15], ["Shadow's Acuteness", 15], ["Shadow's Agility", 15], ["Shadow's Fleetness", 15], ["Shadow's Nimbleness", 15], ["Shadow's Quickness", 15], ["Shadow's Reflex", 15], ["Shadow's Swiftness", 15], ['Siege Shot 1', 15], ['Siege Shot 2', 15], ['Siege Shot 3', 15], ['Siege Shot 4', 15], ['Siege Shot 5', 15], ['Siege Shot 6', 15], ['Siege Shot 7', 15], ['Siege Shot 8', 15], ['Solidified Skin', 15], ['Superior Gift of Foresight', 15], ['Taxing Embrace', 15], ['Taxing Grasp of Februstos', 15], ["Tegashrig's Accommodation", 15], ["Tegashrig's Arbitration", 15], ["Tegashrig's Mediation", 15], ["Tegashrig's Negotiation", 15], ["Teragani's Fury", 15], ["Teragani's Ire", 15], ["Teragani's Rage", 15], ['Test of Courage', 15], ['Test of Honor', 15], ['Test of Mettle', 15], ['Test of Mind', 15], ['Test of Nerve', 15], ['Test of Power', 15], ['Test of Spirit', 15], ['Test of Strength', 15], ['Tiring Embrace', 15], ['Tiring Grasp of Februstos', 15], ['Toiling Embrace', 15], ['Toiling Grasp of Februstos', 15], ['War Howl', 15], ['Warbellow', 15], ['Warcry', 15], ['Warholler', 15], ['Warshriek', 15], ['Way of Perfection', 15], ['Weakening Embrace', 15], ['Weakening Grasp of Februstos', 15], ['Wither Defenses', 15], ['Abate Senses', 10], ['Banish Senses', 10], ['Devastate Senses', 10], ['Diminish Senses', 10], ['Eyes of the Scout', 10], ['Eyes of the Sentinel', 10], ['Eyes of the Watchman', 10], ['Greater Lullaby', 10], ['Hinder Senses', 10], ['Lesser Lullaby', 10], ['Lullaby', 10], ['Neutralize', 10], ["Odin's Antidote", 10], ["Odin's Cure", 10], ["Odin's Elixir", 10], ["Odin's Greater Antidote", 10], ["Odin's Greater Cure", 10], ["Odin's Greater Elixir", 10], ["Odin's Greater Medicant", 10], ["Odin's Medicant", 10], ['Stunning Bellow', 10], ['Stunning Screech', 10], ['Stunning Shout', 10], ['Subdue', 10], ['Superior Lullaby', 10], ['Supress', 10], ['Weaken Senses', 10], ['Aching Curse', 8], ['Advancing Blow', 8], ['Amplified Celerity', 8], ["Angel's Refreshment", 8], ['Annullling Aura', 8], ["Archangel's Refreshment", 8], ['Arthritic Curse', 8], ['Assailing Blow', 8], ['Attack Unending', 8], ['Audible Barrier', 8], ['Aura of Darkness', 8], ['Aura of Death', 8], ['Aura of Destiny', 8], ['Aura of Fate', 8], ['Aura of Foreboding', 8], ['Aura of the Inevitable', 8], ['Barrier of Faith', 8], ['Barrier of Sound', 8], ['Barrier of Temperance', 8], ['Barrier of Virtue', 8], ['Bashing Aura', 8], ['Battle Fervor', 8], ['Battle Fury', 8], ['Battle Vigor', 8], ['Battle Zeal', 8], ["Benefactor's Encouragement", 8], ['Break Skeleton', 8], ['Celerity', 8], ['Chant of Blood', 8], ['Chant of Energy', 8], ['Chant of Persistence', 8], ['Chant of Stamina', 8], ['Chant of Tenacity', 8], ['Chant of the Battle', 8], ['Chant of the Brawl', 8], ['Chant of the Charge', 8], ['Chant of the Fight', 8], ['Chant of the Siege', 8], ['Chant of the War', 8], ['Collapse Skeleton', 8], ['Confining Curse', 8], ['Cramping Curse', 8], ['Crippling Curse', 8], ['Crumble Skeleton', 8], ['Crumple Skeleton', 8], ['Crunch Skeleton', 8], ["Crusader's Barrier", 8], ["Crusader's Defense", 8], ["Crusader's Guard", 8], ["Crusader's Mantle", 8], ["Crusader's Protection", 8], ["Crusader's Refreshment", 8], ["Crusader's Shelter", 8], ["Crusader's Shield", 8], ["Crusader's Ward", 8], ['Crush Skeleton', 8], ['Crushing Aura', 8], ['Daring Blow', 8], ['Decimating Aura', 8], ['Demand of Integrity', 8], ['Demand of Perfection', 8], ['Demand of Precision', 8], ['Demand of Purity', 8], ['Demand of Quality', 8], ['Demand of Superiority', 8], ['Demand of Supremacy', 8], ['Demand of Transcendence', 8], ['Demolishing Aura', 8], ['Destructive Blow', 8], ['Disintegrate Skeleton', 8], ['Dissolve Skeleton', 8], ['Elemental Deflection Chant', 8], ['Elemental Deflection Song', 8], ['Elemental Guarding Hymn', 8], ['Elemental Protection Hymn', 8], ['Elemental Shield', 8], ['Elemental Ward', 8], ['Encoraching Blow', 8], ['Enhanced Celerity', 8], ['Eradicating Aura', 8], ['Glorious Song of Rest', 8], ['Greater Battle Fervor', 8], ['Greater Battle Fury', 8], ['Greater Battle Vigor', 8], ['Greater Battle Zeal', 8], ['Greater Refreshment', 8], ['Grind Skeleton', 8], ["Guardian's Encouragement", 8], ['Harmonic Song of Rest', 8], ['Harmonic Song of Travel', 8], ['Heavenly Song of Rest', 8], ['Heavenly Song of Travel', 8], ['Hostile Blow', 8], ['Hymn of Soul Guarding', 8], ['Hymn of Soul Protection', 8], ['Illusion of Guarding', 8], ['Illusion of Protection', 8], ['Illusion of Shielding', 8], ['Ineluctable Hindrance', 8], ['Ineludible Encumberance', 8], ['Ineludible Hindrance', 8], ['Inescapable Encumberance', 8], ['Inevitable Encumberance', 8], ['Inevitable Hindrance', 8], ['Intruding Blow', 8], ['Intrusive Blow', 8], ['Lesser Refreshment', 8], ['Magic Shield', 8], ['Magic Ward', 8], ['Magnificent Song of Rest', 8], ['Magnificent Song of Travel', 8], ['Major Refreshment', 8], ['Minor Refreshment', 8], ['Mold Burst', 8], ['Mold Cloud', 8], ['Mold Explosion', 8], ['Murder Aura', 8], ["Nature's Barrier", 8], ["Nature's Feud", 8], ["Nature's Guard", 8], ["Nature's Reckoning", 8], ["Nature's Retaliation", 8], ["Nature's Retribution", 8], ["Nature's Revenge", 8], ["Nature's Vendetta", 8], ["Nature's Vengeance", 8], ["Nature's Wall", 8], ["Odin's Faith", 8], ["Odin's Greater Retribution", 8], ["Odin's Lesser Retribution", 8], ["Odin's Major Retribution", 8], ["Odin's Minor Retribution", 8], ["Odin's Retribution", 8], ["Odin's Temperance", 8], ["Odin's Virtue", 8], ["Paragon's Encouragement", 8], ['Paralyzing Curse', 8], ['Powder Skeleton', 8], ["Protector's Encouragement", 8], ['Pugnacious Blow', 8], ['Pulverize Skeleton', 8], ['Pure Celerity', 8], ['Refreshment', 8], ['Resounding Barrier', 8], ["Saint's Refreshment", 8], ['Shackling Curse', 8], ['Shattering Aura', 8], ['Shield of Melody', 8], ['Simple Song of Rest', 8], ['Simple Song of Travel', 8], ['Song of Clarity', 8], ['Song of Empowering', 8], ['Song of Energy', 8], ['Song of Power', 8], ['Song of Rest', 8], ['Song of Travel', 8], ['Song of the Mind', 8], ['Soul Bolstering Chant', 8], ['Soul Bolstering Song', 8], ['Soul Shield', 8], ['Soul Ward', 8], ['Tumultuous Barrier', 8], ['Unavoidable Encumberance', 8], ['Unavoidable Hindrance', 8], ['Wall of Song', 8], ["Warden's Encouragement", 8], ['Wracking Aura', 8], ["Wraith's Barricade", 8], ["Wraith's Barrier", 8], ["Wraith's Shield", 8], ['Dark Horror', 7], ['Demon Horror', 7], ['Evil Horror', 7], ['Mind Horror', 7], ['Vile Horror', 7], ['Earth Eddies', 6], ['Earth Ripple', 6], ['Earth Splash', 6], ['Earth Wave', 6], ['Ice Bond', 6], ['Mark of Devastation', 6], ['Mark of Havoc', 6], ['Mark of Ruin', 6], ['Mark of Undoing', 6], ['Sphere of Annihilation', 6], ['Sphere of Negation', 6], ['Sphere of Oblivion', 6], ['Sphere of Unmaking', 6], ['Abolish Strength', 5], ['Abrogate Coordination', 5], ['Abrogate Strength', 5], ['Agitating Scintillation', 5], ['Alacrity of Kelgor', 5], ['Alluring Melodies', 5], ['Annihilate Strength', 5], ['Array of Scintillation', 5], ['Attenuate Strength', 5], ['Attracting Melodies', 5], ['Ban Sight', 5], ['Banish Confidence', 5], ['Banish Conviction', 5], ['Banish Dedication', 5], ['Banish Faith', 5], ['Banish Hope', 5], ['Banish Motivation', 5], ['Banish Will', 5], ['Barbs of Kelgor', 5], ['Bear Blows', 5], ['Bear Lacerations', 5], ['Bear Punctures', 5], ['Bestial Blows', 5], ['Blank Coordination', 5], ['Blanket of Darkness', 5], ['Bleed Might', 5], ['Bleed Strength', 5], ['Blinding Scintillation', 5], ['Block Spirit', 5], ['Bolster Bonecaster', 5], ['Boost Bonecaster', 5], ['Brutal Blows', 5], ['Cancel Strength', 5], ['Captivating Melodies', 5], ['Claws of Kelgor', 5], ['Constricting Field', 5], ['Cover Eyes', 5], ['Cripple Body', 5], ['Critical Imbalance', 5], ['Curse of Blindness', 5], ['Dark Empowerment', 5], ['Darken Vision', 5], ['Dazzling Flare', 5], ['Dazzling Flash', 5], ['Dazzling Strobe', 5], ['Dazzling Torch', 5], ['Deadly Empowerment', 5], ['Debilitate Body', 5], ['Debilitate Strength', 5], ['Deflect Blows', 5], ['Deflect Lacerations', 5], ['Deflect Punctures', 5], ['Degenerate Body', 5], ['Destroy Coordination', 5], ['Deteriorate Body', 5], ['Diffuse Fervor', 5], ['Diffuse Strength', 5], ['Diffuse Zeal', 5], ['Dilapidate Body', 5], ['Disperse Fervor', 5], ['Disperse Health', 5], ['Disperse Strength', 5], ['Disperse Vigor', 5], ['Disperse Zeal', 5], ['Dissipate Fervor', 5], ['Dissipate Zeal', 5], ['Distracting Scintillation', 5], ['Disturbing Scintillation', 5], ['Drive of Kelgor', 5], ['Dull Sight', 5], ['Emasculate Strength', 5], ['Enchanting Melodies', 5], ['Endless Burden', 5], ['Endure Blows', 5], ['Endure Lacerations', 5], ['Endure Punctures', 5], ['Enfeeble Body', 5], ['Enfeeble Strength', 5], ['Enticing Melodies', 5], ['Envelope of Darkness', 5], ['Evasion of Kelgor', 5], ['Evil Empowerment', 5], ['Exhaust Strength', 5], ['Extinguish Coordination', 5], ['Extinguish Strength', 5], ['Fangs of Kelgor', 5], ['Fatigue Body', 5], ['Feral Blows', 5], ['Fervor of Kelgor', 5], ['Field of Darkness', 5], ['Field of Scintillation', 5], ['Fierce Blows', 5], ['Fleetness of Kelgor', 5], ['Friction', 5], ['Galaxy of Scintillation', 5], ['Globe of Darkness', 5], ['Greater Curse of Blindness', 5], ['Greater Friction', 5], ['Greater Imbalance', 5], ['Greater Vitality Dispersal', 5], ['Harry Spirit', 5], ['Heat Chains', 5], ['Heat Clamp', 5], ['Heat Lock', 5], ['Heat Net', 5], ['Heat Snare', 5], ['Heat Web', 5], ['Hinder Spirit', 5], ['Hooks of Kelgor', 5], ['Ignore Blows', 5], ['Ignore Lacerations', 5], ['Ignore Punctures', 5], ['Imbalance', 5], ['Impair Strength', 5], ['Impede Spirit', 5], ['Inflict Excruciation', 5], ['Inflict Greater Excruciation', 5], ['Inflict Greater Malaise', 5], ['Inflict Greater Misery', 5], ['Inflict Greater Suffering', 5], ['Inflict Malaise', 5], ['Inflict Misery', 5], ['Inflict Suffering', 5], ['Intoning Aura ', 5], ["Kelgor's Boon", 5], ["Kelgor's Gift", 5], ["Kelgor's Reward", 5], ['Lessen Strength', 5], ['Lesser Friction', 5], ['Lesser Health Dispersal', 5], ['Lesser Imbalance', 5], ['Lesser Strength Dispersal', 5], ['Lesser Vigor Dispersal', 5], ['Magic Empowerment', 5], ['Magical Net', 5], ['Magical Trap', 5], ['Magical Web', 5], ['Major Constricting Field', 5], ['Major Friction', 5], ['Major Imbalance', 5], ['Major Mesh of Force', 5], ['Major Net of Force', 5], ['Major Restraining Field', 5], ['Major Web of Force', 5], ['Mania of Kelgor', 5], ['Mesh of Force', 5], ['Mesmerizing Glare ', 5], ['Mesmerizing Glower', 5], ['Mesmerizing Scowl', 5], ['Minor Friction', 5], ['Minor Imbalance', 5], ['Minor Lullaby', 5], ['Minor Mesh of Force', 5], ['Minor Net of Force', 5], ['Minor Web of Force', 5], ['Mystic Net', 5], ['Mystic Trap', 5], ['Mystic Web', 5], ['Nails of Kelgor', 5], ['Necrotic Empowerment', 5], ['Negate Coordination', 5], ['Negate Strength', 5], ['Net of Force', 5], ['Null Strength', 5], ['Nullify Coordination', 5], ['Obliterate Coordination', 5], ['Obliviate Coordination', 5], ['Obscure View', 5], ['Obstruct Spirit', 5], ['Oscillating Aura ', 5], ['Paralyzing Friction', 5], ['Passion of Kelgor', 5], ['Perturbing Scintillation', 5], ['Pleasurable Melodies', 5], ['Quell Strength', 5], ['Quickness of Kelgor', 5], ['Relentless Blows', 5], ['Resonating Aura ', 5], ['Restrain Spirit', 5], ['Restraining Field', 5], ['Reverberating Aura ', 5], ['Sap Might', 5], ['Sap Strength', 5], ['Savage Blows', 5], ['Scatter Fervor', 5], ['Scatter Zeal', 5], ['Screen of Darkness', 5], ['Sea of Scintillation', 5], ['Shrill Aura ', 5], ['Shroud of Darkness', 5], ['Sky of Scintillation', 5], ['Sonorous Aura ', 5], ['Soporific Scintillation', 5], ['Sorcerous Web', 5], ['Speed of Kelgor', 5], ['Subvert Strength', 5], ['Superior Friction', 5], ['Superior Imbalance', 5], ['Support Bonecaster', 5], ['Suppress Strength', 5], ['Swiftness of Kelgor', 5], ['Talons of Kelgor', 5], ['Unceasing Burden', 5], ['Undermine Strength', 5], ['Undulating Aura ', 5], ['Unmake Strength', 5], ['Veil of Darkness', 5], ['Vitiate Strength', 5], ['Voice of Horror', 5], ['Voice of Shock', 5], ['Void Strength', 5], ['Weaken Body', 5], ['Weaken Strength', 5], ['Weather Blows', 5], ['Weather Lacerations', 5], ['Weather Punctures', 5], ['Withstand Blows', 5], ['Withstand Lacerations', 5], ['Withstand Punctures', 5], ['Wrap of Darkness', 5], ['Zeal of Kelgor', 5], ['Volley 2', 3], ['Chthonic Form', 2], ['Decrepit Form', 2], ['Spirit Form', 2], ['Blunt Arrows', 1], ['Power Shield', 1], ['Slashing Arrows', 1], ['Thrusting Arrows', 1]]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 300,
    minWidth: 100,
    minHeight: 100,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    focusable: true,
    focus: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    transparent: true,
    alwaysOnTop: true
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.on('closed', () => (mainWindow = null));
      const shortcut = 'CommandOrControl+Alt+X';
      globalShortcut.register(shortcut, () => {
        if (chatLogPath) {
          fs.unlink(chatLogPath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
              dialog.showErrorBox('Error', "Can't delete the file. Please check if logging is disabled");
            } else {
              console.log('File deleted successfully.');
              resetValues();
              let dps = 0;
              let hps = 0;
              let ihps = 0;
              let idps = 0;
              mainWindow.webContents.send('update-values', { damageOut, heals, iheals, damageInc, dps, hps, idps });
              mainWindow.webContents.send('update-chart-map', damageMap, healMap, ihealMap, damageIncMap, combinedMap);
            }
          });
        } else {
          dialog.showErrorBox('Error', 'No file selected to delete.');
        }
      });

}


function damageLine(regexMatch) {
  const [, timestamp, target, val] = regexMatch;
  let lineTimestamp = updateTimestamp(timestamp)
  if (dpsTimeStart == 0) {
    dpsTimeStart = lineTimestamp;
  }
  dpsTimeEnd = lineTimestamp;
  if (damageMap.has(lineTimestamp)) {
    const currentValue = parseInt(damageMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    damageMap.set(lineTimestamp, newValue);
  } else {
    damageMap.set(lineTimestamp, parseInt(val, 10));
  }

  updateSpellMap(spellName, val);

  combinedMap.set(lineTimestamp, 0)
  damageOut += parseInt(val, 10);
}

function updateSpellMap(spell, val) {
  if (spellDamageMap.has(spell)) {
    const stats = spellDamageMap.get(spell);
    if (stats instanceof Map) {
      let currentValue = parseInt(stats.get("output"), 10);
      let newValue = currentValue + parseInt(val, 10);
      stats.set("output", newValue)

      currentValue = parseInt(stats.get("hits"), 10);
      newValue = currentValue + 1;
      stats.set("hits", newValue)

      spellDamageMap.set(spell, stats);
    }
  } else {
    if (spell != ""){
      const spellStats = new Map();
      spellStats.set("output", parseInt(val, 10))
      spellStats.set("hits", 1)
      spellDamageMap.set(spell, spellStats);
    }
  }
}

function updateMeleeMap(spell, val) {
  if (meleeDamageMap.has(spell)) {
    const stats = meleeDamageMap.get(spell);
    if (stats instanceof Map) {
      let currentValue = parseInt(stats.get("output"), 10);
      let newValue = currentValue + parseInt(val, 10);
      stats.set("output", newValue)

      currentValue = parseInt(stats.get("hits"), 10);
      newValue = currentValue + 1;
      stats.set("hits", newValue)

      meleeDamageMap.set(spell, stats);
    }
  } else {
    if (spell != ""){
      const spellStats = new Map();
      spellStats.set("output", parseInt(val, 10))
      spellStats.set("hits", 1)
      meleeDamageMap.set(spell, spellStats);
    }
  }
}

function updateHealMap(target, val) {
  if (healTargetMap.has(target)) {
    const stats = healTargetMap.get(target);
    if (stats instanceof Map) {
      let currentValue = parseInt(stats.get("output"), 10);
      let newValue = currentValue + parseInt(val, 10);
      stats.set("output", newValue)

      currentValue = parseInt(stats.get("hits"), 10);
      newValue = currentValue + 1;
      stats.set("hits", newValue)

      healTargetMap.set(target, stats);
    }
  } else {
    if (target != ""){
      const spellStats = new Map();
      spellStats.set("output", parseInt(val, 10))
      spellStats.set("hits", 1)
      healTargetMap.set(target, spellStats);
    }
  }
}

let previousTimestamp = "-01:-01:-01"; // Initial value for comparison
let currentDate = new Date(); // Current date for the initial timestamp
let datePrefix = `${currentDate.getFullYear()}:${String(currentDate.getMonth() + 1).padStart(2, '0')}:${String(currentDate.getDate()).padStart(2, '0')}`;

function updateTimestamp(lineTimestamp) {
  const [prevHour, prevMinute, prevSecond] = previousTimestamp.split(":").map(Number);
  const [lineHour, lineMinute, lineSecond] = lineTimestamp.split(":").map(Number);

  // Check if the line timestamp is earlier than the previous one (indicating a day rollover)
  if (
    lineHour < prevHour ||
    (lineHour === prevHour && lineMinute < prevMinute) ||
    (lineHour === prevHour && lineMinute === prevMinute && lineSecond < prevSecond)
  ) {
    // Increment the day
    let currentDateObject = new Date( datePrefix.replace(/:/g, '-').replace(' ', 'T')); // Convert yyyy:mm:dd to Date object
    currentDateObject.setDate(currentDateObject.getDate() + 1);
    currentDateObject = new Date(currentDateObject)
    datePrefix = `${currentDateObject.getFullYear()}:${String(currentDateObject.getMonth() + 1).padStart(2, '0')}:${String(currentDateObject.getDate()+1).padStart(2, '0')}`;
  }
  
  previousTimestamp = lineTimestamp; // Update the global previousTimestamp
  return `${datePrefix} ${lineTimestamp}`; // Return the updated timestamp
}

function damageWeapLine(regexMatch) {
  const [, timestamp, target, weapon, val] = regexMatch;
  let lineTimestamp = updateTimestamp(timestamp)
  if (dpsTimeStart == 0) {
    dpsTimeStart = timestamp;
  }
  dpsTimeEnd = timestamp;
  if (damageMap.has(lineTimestamp)) {
    const currentValue = parseInt(damageMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    damageMap.set(lineTimestamp, newValue);
  } else {
    damageMap.set(lineTimestamp, parseInt(val, 10));
  }
  if (spellName == "") {
    updateMeleeMap(weapon, val);
  } else {
    updateMeleeMap(spellName, val);
  }

  combinedMap.set(lineTimestamp, 0)
  damageOut += parseInt(val, 10);
}

function dotNPetLine(regexMatch) {
  const [, timestamp, spell, target, val] = regexMatch;
  let lineTimestamp = updateTimestamp(timestamp)
  if (dpsTimeStart == 0) {
    dpsTimeStart = timestamp;
  }
  dpsTimeEnd = timestamp;
  if (damageMap.has(lineTimestamp)) {
    const currentValue = parseInt(damageMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    damageMap.set(lineTimestamp, newValue);
  } else {
    damageMap.set(lineTimestamp, parseInt(val, 10));
  }


  updateSpellMap(spell, val);

  combinedMap.set(lineTimestamp, 0)
  damageOut += parseInt(val, 10);
}

function critLine(regexMatch) {
  const [, timestamp, val] = regexMatch;
  let lineTimestamp = updateTimestamp(timestamp)
  if (dpsTimeStart == 0) {
    dpsTimeStart = timestamp;
  }
  dpsTimeEnd = timestamp;
  if (damageMap.has(lineTimestamp)) {
    const currentValue = parseInt(damageMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    damageMap.set(lineTimestamp, newValue);
  } else {
    damageMap.set(lineTimestamp, parseInt(val, 10));
  }


  updateSpellMap(spellName, val);

  combinedMap.set(lineTimestamp, 0)
  damageOut += parseInt(val, 10);
}

function healLine(regexMatch) {
  const [, timestamp, target, val] = regexMatch;
  let lineTimestamp = updateTimestamp(timestamp)
  if (healTimeStart == 0) {
    healTimeStart = timestamp;
  }

  if (healMap.has(lineTimestamp)) {
    const currentValue = parseInt(healMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    healMap.set(lineTimestamp, newValue);
  } else {
    healMap.set(lineTimestamp, parseInt(val, 10));
  }

  // updateSpellMap(spellName, val);
  updateHealMap("Out: "+target, val)

  combinedMap.set(lineTimestamp, 0)
  healTimeEnd = timestamp;
  heals += parseInt(val, 10);
}

function healByLine(regexMatch) {
  const [, timestamp, target, val] = regexMatch;
  let lineTimestamp = updateTimestamp(timestamp)
  if (healTimeStart == 0) {
    healTimeStart = timestamp;
  }

  if (ihealMap.has(lineTimestamp)) {
    const currentValue = parseInt(ihealMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    ihealMap.set(lineTimestamp, newValue);
  } else {
    ihealMap.set(lineTimestamp, parseInt(val, 10));
  }

  updateHealMap("In: "+target, val)

  combinedMap.set(lineTimestamp, 0)
  healTimeEnd = timestamp;
  iheals += parseInt(val, 10);
}

function healCritLine(regexMatch) {
  const [, timestamp, val] = regexMatch;
  let lineTimestamp = updateTimestamp(timestamp)
  if (healTimeStart == 0) {
    healTimeStart = timestamptimestamp;
  }

  if (healMap.has(lineTimestamp)) {
    const currentValue = parseInt(healMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    healMap.set(lineTimestamp, newValue);
  } else {
    healMap.set(lineTimestamp, parseInt(val, 10));
  }

  
  updateHealMap("Out: "+target, val)
  // updateSpellMap(spellName, val);

  combinedMap.set(lineTimestamp, 0)
  healTimeEnd = timestamp;
  heals += parseInt(val, 10);
}


function damageIncLine(regexMatch) {
  const [, timestamp, val] = regexMatch;
  let lineTimestamp = updateTimestamp(timestamp)
  if (damageIncTimeStart == 0) {
    damageIncTimeStart = timestamp;
  }

  if (damageIncMap.has(lineTimestamp)) {
    const currentValue = parseInt(damageIncMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    damageIncMap.set(lineTimestamp, newValue);
  } else {
    damageIncMap.set(lineTimestamp, parseInt(val, 10));
  }
  combinedMap.set(lineTimestamp, 0)
  damageIncTimeEnd = timestamp;
  damageInc += parseInt(val, 10);
}

let loggingEnabled = false;
let spellName = "";

function resetValues() {
  dpsTimeStart = 0;
  dpsTimeEnd= 0;
  damageOut = 0;
  healTimeStart = 0;
  healTimeEnd;
  heals = 0;
  iheals = 0;
  damageInc = 0;
  damageMap = new Map();
  healMap = new Map();
  ihealMap = new Map();
  combinedMap = new Map();
  damageIncMap = new Map();
  spellDamageMap = new Map();
  healTargetMap = new Map();
  meleeDamageMap = new Map();
}

function readChatLog() {

  const damageRegex = /\[(\d{2}:\d{2}:\d{2})\] You hit (.+) for (\d+).+?damage/; // time, target, value
  const dotNPetRegex = /\[(\d{2}:\d{2}:\d{2})\] Your (.+) hits (.+) for (\d+).+?damage!/; // time, spell, target, value
  const critRegex = /\[(\d{2}:\d{2}:\d{2})\] You critically hit for an additional (\d+).+?damage!/ // timestamp, val
  const healRegex = /\[(\d{2}:\d{2}:\d{2})\] You heal (.+) for (\d+) hit points./; // time, target, value
  const healByRegex = /\[(\d{2}:\d{2}:\d{2})\] You are healed by (.+) for (\d+) hit points./; // time, target, value
  const critAttackPattern = /\[(\d{2}:\d{2}:\d{2})\] You critically hit .+? for an additional (\d+) damage!/;
  const dotCritPattern = /\[(\d{2}:\d{2}:\d{2})\] Your (.+?) critically hits (.+?) for an additional (\d+) damage!/; // 1:spellName, 2:damageValue
  const critHealPattern = /\[(\d{2}:\d{2}:\d{2})\] Your heal criticals for an extra (\d+) amount of hit points!/;
  const dotDamagePattern = /\[(\d{2}:\d{2}:\d{2})\] Your (.+?) attacks (.+?) and hits for (\d+).+?damage!/; // 1:spellName, 2:damageValue
  const attackPattern = /\[(\d{2}:\d{2}:\d{2})\] You attack (.+?) with your (.+?) and hit for (\d+).+?damage!/; // 1:weaponName, 2:damage

  const startCastPattern = /\[(\d{2}:\d{2}:\d{2})\] You begin casting a (.+?) spell!/; // 1: time 2: spellName
  const spellPattern = /\[(\d{2}:\d{2}:\d{2})\] You cast a (.+?) spell!/; // 1: time 2: spellName
  const shotPattern = /\[(\d{2}:\d{2}:\d{2})\] You fire a (.+?)!/; // 1: time 2: spellName

  const styleGrowthPattern = /\[(\d{2}:\d{2}:\d{2})\] You perform your (.+?) perfectly!/;
  const killPattern = /\[(\d{2}:\d{2}:\d{2})\] You just killed (.+?)!/;
  
  const bodyDamagePattern = /\[(\d{2}:\d{2}:\d{2})\] .+? hits your .+? for (\d+).*damage!/;
  const incDamagePattern = /\[(\d{2}:\d{2}:\d{2})\] .+? hits you for (\d+) .+?damage!/;

  const resistPattern = /\[(\d{2}:\d{2}:\d{2})\] .+?resists the effect!.+?/;
  const interruptedPattern = /\[(\d{2}:\d{2}:\d{2})\] (interrupt your spellcast)|(spell is interrupted)|(interrupt your focus)/;
  
  const overHealedPattern = /\[(\d{2}:\d{2}:\d{2})\] fully healed/;
 
  const logOpenedPattern = /Chat Log Opened:\s*(.+? \d{2}:\d{2}:\d{2} \d{4})/;
  const logClosedPattern = /Chat Log Closed:.+?\d{2}:\d{2}:\d{2} \d{4}/;


  try {
    if (fileSize > lastReadPosition) {
      const stream = fs.createReadStream(gatorLog, {
        start: lastReadPosition, // Start reading from the last position
        end: fileSize,           // Read until the end of the file
        encoding: 'utf8',
      });

      stream.on('data', (chunk) => {
        const lines = chunk.split('\n');
        lines.forEach((line) => {

          const damageMatch = line.match(damageRegex);
          const dotNPetMatch = line.match(dotNPetRegex);
          const critMatch = line.match(critRegex);
    
          const healMatchh = line.match(healRegex);
          const healByMatchh = line.match(healByRegex);
    
          const critAttackMatch = line.match(critAttackPattern);
          const dotCritMatch = line.match(dotCritPattern);
          const critHealMatch = line.match(critHealPattern);
          const dotDamageMatch = line.match(dotDamagePattern);
          const attackMatch = line.match(attackPattern);
    
          const incDamageMatch = line.match(incDamagePattern);
          const bodyDamageMatch = line.match(bodyDamagePattern);
    
          const logOpenedMatch = line.match(logOpenedPattern);
          const logClosedMatch = line.match(logClosedPattern);
    
          const startCastMatch = line.match(startCastPattern);
          const spellMatch = line.match(spellPattern);
          const shotMatch = line.match(shotPattern);
          const styleGrowthMatch = line.match(styleGrowthPattern);
    
          const resistMatch = line.match(resistPattern);
          const interruptedMatch = line.match(interruptedPattern);
          if (damageMatch) {
            damageLine(damageMatch);
            
    
          } else if (healMatchh) {
            healLine(healMatchh);
    
          } else if (healByMatchh) {
            healByLine(healByMatchh);
    
          } else if (dotNPetMatch) {
            dotNPetLine(dotNPetMatch);
          } else if (critMatch) {
            critLine(critMatch);
          } 
          else if (critAttackMatch) {
            critLine(critAttackMatch);
          } else if (dotCritMatch) {
            dotNPetLine(dotCritMatch);
          } else if (critHealMatch) {
            healCritLine(critHealMatch);
          } else if (dotDamageMatch) {
            dotNPetLine(dotDamageMatch);
          } else if (attackMatch) {
            damageWeapLine(attackMatch);
          }
          else if (incDamageMatch) {
            damageIncLine(incDamageMatch);
          } else if (bodyDamageMatch) {
            damageIncLine(bodyDamageMatch);
          } 
          else if (logOpenedMatch) {
            loggingEnabled = true;
            const timestamp = logOpenedMatch[1];
            currentDate = new Date(timestamp);
            datePrefix = `${currentDate.getFullYear()}:${String(currentDate.getMonth() + 1).padStart(2, '0')}:${String(currentDate.getDate()).padStart(2, '0')}`;
          } else if (logClosedMatch) {
            loggingEnabled = false;
          } 
    
          else if (resistMatch) {
            spellName = "";
          } else if (interruptedMatch) {
            spellName = "";
          } 
    
          else if (startCastMatch) {
            const [, lineTimestamp, val] = startCastMatch;
            spellName = val;
          } else if (spellMatch) {
            const [, lineTimestamp, val] = spellMatch;
            spellName = val;
            if (spellMap.has(spellName)) {
              let recast = spellMap.get(spellName)
              // console.log(datePrefix, lineTimestamp, " - start cooldown: ", recast+ "s for ", spellName);
            }
          }  else if (shotMatch) {
            const [, lineTimestamp, val] = shotMatch;
            spellName = val;
          } 
          else if (styleGrowthMatch) {
            const [, lineTimestamp, val, growth] = styleGrowthMatch;
            spellName = val;
          }
    
      });
    
    
      let currentTime = new Date(`1970-01-01T${dpsTimeStart}`);
      let lastTime = new Date(`1970-01-01T${dpsTimeEnd}`);
      let elapsedTime = (lastTime - currentTime) / 1000;
      let dps = parseFloat((elapsedTime > 0 ? damageOut / elapsedTime : 0).toFixed(2));
    
      currentTime = new Date(`1970-01-01T${healTimeStart}`);
      lastTime = new Date(`1970-01-01T${healTimeEnd}`);
      elapsedTime = (lastTime - currentTime) > 0 ? (lastTime - currentTime) / 1000 : 0;
      let hps = parseFloat((elapsedTime > 0 ? heals / elapsedTime : heals).toFixed(2));
    
      let ihps = parseFloat((elapsedTime > 0 ? iheals / elapsedTime : iheals).toFixed(2));
    
      currentTime = new Date(`1970-01-01T${damageIncTimeStart}`);
      lastTime = new Date(`1970-01-01T${damageIncTimeEnd}`);
      elapsedTime = (lastTime - currentTime) > 0 ? (lastTime - currentTime) / 1000 : 0;
      let idps = parseFloat((elapsedTime > 0 ? damageInc / elapsedTime : damageInc).toFixed(2));
      mainWindow.webContents.send('update-header',  loggingEnabled );
      mainWindow.webContents.send('update-values', { damageOut, heals, iheals, damageInc, dps, hps, idps, ihps });
      mainWindow.webContents.send('update-chart-map', damageMap, healMap, ihealMap, damageIncMap, combinedMap);
      updateTableData(spellDamageMap, healTargetMap, meleeDamageMap);
      });

      // Update the last read position to the current end of the file
      lastReadPosition = fileSize;
    }
  } catch (error) {
    console.error('Error reading chat log:', error.message);
  }
}



app.on('ready', createWindow);

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

let gatorLog;
let lastReadPosition = 0;


ipcMain.on('select-file', () => {
  const result = dialog.showOpenDialogSync(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Log Files', extensions: ['log'] }],
  });

  if (result && result.length > 0 ) {
    chatLogPath = result[0];
    const watcher = chokidar.watch(chatLogPath, {
      ignoreInitial: true,

    });

    gatorLog = path.join(path.dirname(chatLogPath), 'chatgator_log');

    setInterval(checkFileChanges, pollingInterval);
    copyFile(chatLogPath, gatorLog);
    const logStats = fs.statSync(gatorLog);
    fileSize = logStats.size;
    readChatLog();
    watcher.on('change', (path) => {
      copyFile(chatLogPath, gatorLog);
      readChatLog();
    });
  }
});

function copyFile(sourcePath, destinationPath) {
  try {
    const fileContent = fs.readFileSync(sourcePath);
    fs.writeFileSync(destinationPath, fileContent);
    console.log('File copied successfully!');
  } catch (error) {
    console.error('Error copying file:', error.message);
  }
}

const pollingInterval = 250;
let previousSize = 0;
let previousMtime = 0;
let fileSize = 0;
function checkFileChanges() {
  fs.stat(chatLogPath, (err, stats) => {
    if (err) {
      console.error('Error getting file stats:', err.message);
      return;
    }
    if (stats.size !== previousSize || stats.mtime.getTime() !== previousMtime) {
      console.log('File has changed!', previousSize, stats.size);
      previousSize = stats.size;
      fileSize = stats.size;
      previousMtime = stats.mtime.getTime();
    }
  });
}


let tableWindow;

let tableWindowHeals;

let tableWindowMelee;




ipcMain.on('open-table-window', (event) => {
  if (!tableWindow || tableWindow.isDestroyed()) {
    tableWindow = new BrowserWindow({
      width: 600,
      height: 300,
      minWidth: 100,
      minHeight: 100,
      autoHideMenuBar: true,
      titleBarStyle: 'hiddenInset',
      focusable: true,
      focus: true,
      frame: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
      resizable: true,
      alwaysOnTop: true
    });

    tableWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    
    tableWindow.loadFile(path.join(__dirname, 'table.html'));
    tableWindow.webContents.on('did-finish-load', () => {
      tableWindow.webContents.send('load-table-data', spellDamageMap);
    });

    tableWindow.on('closed', () => {
      tableWindow = null;
    });
  }
});

ipcMain.on('open-table-window-melee', (event) => {
  if (!tableWindowMelee || tableWindowMelee.isDestroyed()) {
    tableWindowMelee = new BrowserWindow({
      width: 600,
      height: 300,
      minWidth: 100,
      minHeight: 100,
      autoHideMenuBar: true,
      titleBarStyle: 'hiddenInset',
      focusable: true,
      focus: true,
      frame: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
      resizable: true,
      alwaysOnTop: true
    });

    tableWindowMelee.setAlwaysOnTop(true, 'screen-saver', 1);
    
    tableWindowMelee.loadFile(path.join(__dirname, 'melee.html'));
    tableWindowMelee.webContents.on('did-finish-load', () => {
      tableWindowMelee.webContents.send('load-table-data-melee', meleeDamageMap);
    });

    tableWindowMelee.on('closed', () => {
      tableWindowMelee = null;
    });
  }
});


ipcMain.on('open-table-window-heals', (event) => {
  if (!tableWindowHeals || tableWindowHeals.isDestroyed()) {
    tableWindowHeals = new BrowserWindow({
      width: 600,
      height: 300,
      minWidth: 100,
      minHeight: 100,
      autoHideMenuBar: true,
      titleBarStyle: 'hiddenInset',
      focusable: true,
      focus: true,
      frame: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
      resizable: true,
      alwaysOnTop: true
    });

    tableWindowHeals.setAlwaysOnTop(true, 'screen-saver', 1);
    
    tableWindowHeals.loadFile(path.join(__dirname, 'heals.html'));
    tableWindowHeals.webContents.on('did-finish-load', () => {
      tableWindowHeals.webContents.send('load-table-data-heals', healTargetMap);
    });

    tableWindowHeals.on('closed', () => {
      tableWindowHeals = null;
    });
  }
});

function updateTableData(updatedSpellData, updatedHealsData, updatedHealsData) {
  if (tableWindow && !tableWindow.isDestroyed()) {
    tableWindow.webContents.send('update-table-data', updatedSpellData);
  }

  if (tableWindowHeals && !tableWindowHeals.isDestroyed()) {
    tableWindowHeals.webContents.send('update-table-data-heals', updatedHealsData);
  }

  if (tableWindowMelee && !tableWindowMelee.isDestroyed()) {
    tableWindowMelee.webContents.send('update-table-data-melee', updatedMeleeData);
  }
}
