(dropCache, actionCache, ingredientCache, skillCache, itemCache, statsStore) => {

    const LOOPS_PER_HOUR = 10 * 60 * 60; // 1 second = 10 loops
    const LOOPS_PER_FOOD = 150;

    const exports = {
        LOOPS_PER_HOUR,
        LOOPS_PER_FOOD,
        getDrops,
        getIngredients,
        getEquipmentUses
    };

    function getDrops(skillId, actionId, isCombat, multiplier = 1) {
        const drops = dropCache.byAction[actionId];
        if(!drops) {
            return [];
        }
        const hasFailDrops = !!drops.find(a => a.type === 'FAILED');
        const hasMonsterDrops = !!drops.find(a => a.type === 'MONSTER');
        const successChance = hasFailDrops ? getSuccessChance(skillId, actionId) / 100 : 1;
        return drops.map(drop => {
            let amount = (1 + drop.amount) / 2 * multiplier * drop.chance;
            if(drop.type !== 'MONSTER' && isCombat && hasMonsterDrops) {
                amount = 0;
            } else if(drop.type === 'MONSTER' && !isCombat) {
                amount = 0;
            } else if(drop.type === 'FAILED') {
                amount *= 1 - successChance;
            } else {
                amount *= successChance;
            }
            if(amount) {
                return {
                    id: drop.item,
                    amount
                };
            }
        })
        .filter(a => a)
        .reduce((a,b) => (a[b.id] = b.amount, a), {});
    }

    function getSuccessChance(skillId, actionId) {
        const action = actionCache.byId[actionId];
        const level = statsStore.getLevel(skillId).level;
        return Math.min(95, 80 + level - action.level) + Math.floor(level / 20);
    }

    function getIngredients(actionId, multiplier = 1) {
        const ingredients = ingredientCache.byAction[actionId];
        if(!ingredients) {
            return [];
        }
        return ingredients.map(ingredient => ({
            id: ingredient.item,
            amount: ingredient.amount * multiplier
        }))
        .reduce((a,b) => (a[b.id] = b.amount, a), {});
    }

    function getEquipmentUses(skillId, actionId, isCombat = false, foodPerHour = 0) {
        const skill = skillCache.byId[skillId];
        const action = actionCache.byId[actionId];
        const result = {};
        const potionMultiplier = 1 + statsStore.get('DECREASED_POTION_DURATION') / 100;
        if(isCombat) {
            if(action.type !== 'OUTSKIRTS') {
                // combat potions
                statsStore.getManyEquipmentItems(itemCache.specialIds.potionCombat)
                    .forEach(a => result[a.id] = 20 * potionMultiplier);
            }
            if(action.type === 'DUNGEON') {
                // dungeon map
                statsStore.getManyEquipmentItems(itemCache.specialIds.map)
                    .forEach(a => result[a.id] = 3);
            }
            if(foodPerHour && action.type !== 'OUTSKIRTS' && statsStore.get('HEAL')) {
                // active food
                statsStore.getManyEquipmentItems(itemCache.specialIds.food)
                    .forEach(a => result[a.id] = foodPerHour);
            }
            if(statsStore.getAttackStyle() === 'Ranged') {
                // ammo
                const attacksPerHour = LOOPS_PER_HOUR / 5 / statsStore.get('ATTACK_SPEED');
                const ammoPerHour = attacksPerHour * (1 - statsStore.get('AMMO_PRESERVATION_CHANCE') / 100);
                statsStore.getManyEquipmentItems(itemCache.specialIds.arrow)
                    .forEach(a => result[a.id] = ammoPerHour);
            }
        } else {
            if(skill.type === 'Gathering') {
                // gathering potions
                statsStore.getManyEquipmentItems(itemCache.specialIds.potionGathering)
                    .forEach(a => result[a.id] = 20 * potionMultiplier);
            }
            if(skill.type === 'Crafting') {
                // crafting potions
                statsStore.getManyEquipmentItems(itemCache.specialIds.potionCrafting)
                    .forEach(a => result[a.id] = 20 * potionMultiplier);
            }
        }
        if(statsStore.get('PASSIVE_FOOD_CONSUMPTION') && statsStore.get('HEAL')) {
            // passive food
            statsStore.getManyEquipmentItems(itemCache.specialIds.food)
                .forEach(a => result[a.id] = statsStore.get('PASSIVE_FOOD_CONSUMPTION')* 3600 / 5 / statsStore.get('HEAL'));
        }
        return result;
    }

    return exports;

}