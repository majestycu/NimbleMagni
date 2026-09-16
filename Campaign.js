window.Campaign = {
    PLAYER_SPEED: 132,
    WALL_MARGIN: 32,

    acts: [
        {
            id: 1,
            name: 'Ashfen Marches',
            biome: 'wilds',
            killGate: 18,
            banner: 'ACT 1 — ASHFEN MARCHES',
            portalLabel: 'Gate to Saltglass',
            mobs: [
                { type: 'rotwalker', fromWave: 0 },
                { type: 'hedge_imp', fromWave: 1 },
                { type: 'bramble_rat', fromWave: 2 },
                { type: 'fen_chanter', fromWave: 1 }
            ],
            boss: { type: 'crypt_warden', name: 'The Crypt Warden' }
        },
        {
            id: 2,
            name: 'Saltglass Waste',
            biome: 'desert',
            killGate: 22,
            banner: 'ACT 2 — SALTGLASS WASTE',
            portalLabel: 'Gate to Silkveil',
            mobs: [
                { type: 'sand_scarab', fromWave: 0 },
                { type: 'dust_jackal', fromWave: 1 },
                { type: 'cinder_nomad', fromWave: 2 }
            ],
            boss: { type: 'dune_hollow', name: 'Dune Hollow' }
        },
        {
            id: 3,
            name: 'Silkveil Temple',
            biome: 'jungle',
            killGate: 24,
            banner: 'ACT 3 — SILKVEIL TEMPLE',
            portalLabel: 'Gate to Ember Council',
            mobs: [
                { type: 'web_drone', fromWave: 0 },
                { type: 'fang_spider', fromWave: 1 },
                { type: 'temple_cultist', fromWave: 2 }
            ],
            boss: { type: 'venom_matron', name: 'Venom Matron' }
        },
        {
            id: 4,
            name: 'Ember Council',
            biome: 'highlands',
            killGate: 26,
            banner: 'ACT 4 — EMBER COUNCIL',
            portalLabel: 'Gate to Last Ember',
            mobs: [
                { type: 'ash_raider', fromWave: 0 },
                { type: 'council_acolyte', fromWave: 1 },
                { type: 'horn_brute', fromWave: 2 }
            ],
            slaughter: { type: 'hall_cleaver', name: 'Hall Cleaver', atKills: 12 },
            boss: { type: 'council_shade', name: 'Council Shade' }
        },
        {
            id: 5,
            name: 'Last Ember Keep',
            biome: 'fortress',
            killGate: 28,
            banner: 'ACT 5 — LAST EMBER KEEP',
            portalLabel: null,
            mobs: [
                { type: 'ember_hound', fromWave: 0 },
                { type: 'void_thrall', fromWave: 1 },
                { type: 'keep_sentinel', fromWave: 2 }
            ],
            boss: { type: 'ash_sovereign', name: 'Ash Sovereign' },
            finale: { type: 'last_ember', name: 'The Last Ember' }
        }
    ],

    current() {
        const id = window.currentAct || 1;
        return this.acts.find(a => a.id === id) || this.acts[0];
    },

    reset() {
        window.currentAct = 1;
        window.actKills = 0;
        window.campaignFlags = {
            bossSpawned: false,
            bossDead: false,
            slaughterSpawned: false,
            slaughterDead: false,
            finaleSpawned: false,
            finaleDead: false,
            portal: null
        };
        return window.campaignFlags;
    }
};
