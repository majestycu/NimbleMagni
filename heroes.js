(function () {
    const REGISTRY = {
        WARRIOR: () => new window.Warrior(),
        MAGE: () => new window.Mage(),
        ROGUE: () => new window.Rogue(),
        NECROMANCER: () => new window.Necromancer(),
        NECRO: () => new window.Necromancer(),
        PALADIN: () => new window.Paladin(),
        DRUID: () => new window.Druid()
    };

    class HeroFactory {
        static createHero(type) {
            const t = (type || 'WARRIOR').toUpperCase();
            const maker = REGISTRY[t];
            if (!maker) {
                throw new Error('Unknown hero type: ' + t);
            }
            const hero = maker();
            if (!hero.type) hero.type = t === 'NECRO' ? 'NECROMANCER' : t;
            if (!hero.skillPool || !hero.skillPool.length) hero.rebuildSkillPool();
            hero.currentSkill = hero.skillPool[0];
            return hero;
        }
    }

    window.HeroFactory = HeroFactory;
    window.HeroRegistry = {
        createHero: (type) => HeroFactory.createHero(type),
        Hero: window.Hero,
        Warrior: window.Warrior,
        Mage: window.Mage,
        Rogue: window.Rogue,
        Necromancer: window.Necromancer,
        Paladin: window.Paladin,
        Druid: window.Druid
    };
    window.HeroManager = window.HeroRegistry;
})();
