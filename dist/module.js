Hooks.once("item-piles-ready", async () => {

    const baseConfig = {
        // These keys and setting are unlikely to ever change

        // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
        "ACTOR_CLASS_TYPE": "NPC",

        // The item class type is the type of item that will be used for the default loot item
        "ITEM_CLASS_LOOT_TYPE": "loot",

        // The item class type is the type of item that will be used for the default weapon item
        "ITEM_CLASS_WEAPON_TYPE": "weapon",

        // The item class type is the type of item that will be used for the default equipment item
        "ITEM_CLASS_EQUIPMENT_TYPE": "equipment",

        // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
        "ITEM_QUANTITY_ATTRIBUTE": "system.quantity",

        // The item price attribute is the path to the attribute on each item that determine how much it costs
        "ITEM_PRICE_ATTRIBUTE": "system.price",

        // Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
        "ITEM_FILTERS": [
            {
                "path": "type",
                "filters": "classFeats, feat, raceFeats, pathFeats, destinyFeats, ritual, power"
            }
        ],

        "PILE_DEFAULTS": {
            merchantColumns: [{
                label: "<i class=\"fa-solid fa-shield\"></i>",
                path: "system.equipped",
                formatting: "{#}",
                buying: false,
                selling: true,
                mapping: {
                    "true": "✔",
                    "false": ""
                }
            }]
        },

        // Item similarities determines how item piles detect similarities and differences in the system
        "ITEM_SIMILARITIES": ["name", "type"],

        // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
        // In the case of attributes, the path is relative to the "actor.system"
        // In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
        "CURRENCIES": [
            {
                type: "attribute",
                name: "DND4E.CurrencyAD",
                img: "icons/commodities/gems/gem-faceted-round-white.webp",
                abbreviation: "{#}AD",
                data: {
                    path: "system.currency.ad"
                },
                primary: false,
                exchangeRate: 10000
            },
            {
                type: "attribute",
                name: "DND4E.CurrencyPP",
                img: "icons/commodities/currency/coin-inset-snail-silver.webp",
                abbreviation: "{#}PP",
                data: {
                    path: "system.currency.pp"
                },
                primary: false,
                exchangeRate: 100
            },
            {
                type: "attribute",
                name: "DND4E.CurrencyGP",
                img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
                abbreviation: "{#}GP",
                data: {
                    path: "system.currency.gp",
                },
                primary: true,
                exchangeRate: 1
            },
            {
                type: "attribute",
                name: "DND4E.CurrencySP",
                img: "icons/commodities/currency/coin-engraved-moon-silver.webp",
                abbreviation: "{#}SP",
                data: {
                    path: "system.currency.sp",
                },
                primary: false,
                exchangeRate: 0.1
            },
            {
                type: "attribute",
                name: "DND4E.CurrencyCP",
                img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
                abbreviation: "{#}CP",
                data: {
                    path: "system.currency.cp",
                },
                primary: false,
                exchangeRate: 0.01
            }
        ],

        "SECONDARY_CURRENCIES": [
            {
                type: "attribute",
                name: "DND4E.RitualCompAR",
                img: "icons/commodities/materials/bowl-powder-teal.webp",
                abbreviation: "{#}AR",
                data: {
                    path: "system.ritualcomp.ar"
                },
            },
            {
                type: "attribute",
                name: "DND4E.RitualCompMS",
                img: "icons/commodities/materials/bowl-liquid-white.webp",
                abbreviation: "{#}MS",
                data: {
                    path: "system.ritualcomp.ms"
                },
            },
            {
                type: "attribute",
                name: "DND4E.RitualCompRH",
                img: "icons/commodities/flowers/holly-buds-white.webp",
                abbreviation: "{#}RH",
                data: {
                    path: "system.ritualcomp.rh"
                },
            },
            {
                type: "attribute",
                name: "DND4E.RitualCompSI",
                img: "icons/commodities/materials/powder-grey.webp",
                abbreviation: "{#}SI",
                data: {
                    path: "system.ritualcomp.si"
                },
            },
            {
                type: "attribute",
                name: "DND4E.RitualCompRS",
                img: "icons/commodities/gems/gem-faceted-cushion-teal.webp",
                abbreviation: "{#}RS",
                data: {
                    path: "system.ritualcomp.rs"
                }
            },
        ],

        "SYSTEM_HOOKS": () => {

            Hooks.on("dnd4e.getItemContextOptions", (item, options) => {
                options.push({
                    name: game.i18n.localize("ITEM-PILES.ContextMenu.GiveToCharacter"),
                    icon: "<i class='fa fa-user'></i>",
                    callback: async () => {
                        return game.itempiles.API.giveItem(item);
                    },
                    condition: !game.itempiles.API.isItemInvalid(item)
                })
            });

        },

        // This function is an optional system handler that specifically transforms an item when it is added to actors
        "ITEM_TRANSFORMER": async (itemData) => {
            ["equipped", "proficient"].forEach(key => {
                if (itemData?.system?.[key] !== undefined) {
                    delete itemData.system[key];
                }
            });
            return itemData;
        },

        "PRICE_MODIFIER_TRANSFORMER": ({
            buyPriceModifier,
            sellPriceModifier,
            actor = false,
            actorPriceModifiers = []
        } = {}) => {

            const modifiers = {
                buyPriceModifier,
                sellPriceModifier
            };

            if (!actor) return modifiers;

            const groupModifiers = actorPriceModifiers
                .map(data => ({ ...data, actor: fromUuidSync(data.actorUuid) }))
                .filter(data => {
                    return data.actor && data.actor.type === "group" && data.actor.system.members.some(member => member === actor)
                });

            modifiers.buyPriceModifier = groupModifiers.reduce((acc, data) => {
                return data.override ? data.buyPriceModifier ?? acc : acc * data.buyPriceModifier;
            }, buyPriceModifier);

            modifiers.sellPriceModifier = groupModifiers.reduce((acc, data) => {
                return data.override ? data.sellPriceModifier ?? acc : acc * data.sellPriceModifier;
            }, sellPriceModifier);

            return modifiers;

        },

        "ITEM_TYPE_HANDLERS": {
            "GLOBAL": {
                [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED]: ({ item }) => {
                    const itemData = item instanceof Item ? item.toObject() : item;
                    return itemData?.system?.container;
                },
                [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED_PATH]: "system.container"
            }
        },
    }

    const VERSIONS = {

        "0.7.11": {
            ...baseConfig,
            "VERSION": "0.9"
        },
        "0.8": {
            ...baseConfig,
            "VERSION": "0.9",
            "ITEM_TYPE_HANDLERS": {
                "backback": {
                    [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.HAS_CURRENCY]: true,
                    [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.CONTENTS]: ({ item }) => {
                        return item.system.contents;
                    },
                    [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.TRANSFER]: ({ item, items, raw = false } = {}) => {
                        for (const containedItem of item.system.contents) {
                            items.push(raw ? containedItem : containedItem.toObject());
                        }
                    }
                }
            }
        }
    }

    for (const [version, data] of Object.entries(VERSIONS)) {
        await game.itempiles.API.addSystemIntegration(data, version);
    }
});