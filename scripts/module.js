export let MM3ActionHandler = null;
export let MM3RollHandler = null;
export let MM3SystemManager = null;
export let DEFAULTS = null;

Hooks.on('tokenActionHudCoreApiReady', async (coreModule) => {
    const CARACTERISTIQUE_ID = 'caracteristique';
    const COMPETENCE_ID = 'competence';
    const POUVOIR_ID = 'pouvoir';
    const ATTAQUE_ID = 'attaque';
    const DEFENSE_ID = 'defense';
    const VITESSE_ID = 'vitesse';
    const ETAT_ID = 'etat';

    /**
     * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
     */
    MM3ActionHandler = class MM3ActionHandler extends coreModule.api.ActionHandler {
        /**
         * Build system actions
         * Called by Token Action HUD Core
         * @override
         * @param {array} groupIds
         */a
        async buildSystemActions (groupIds) {
            
            // Set actor and token variables
            this.actorType = this.actor?.type;

            // Set items variable
            if (this.actor) {
                let items = this.actor.items
                items = coreModule.api.Utils.sortItemsByName(items)
                this.items = items
            }

            if (this.actorType === 'personnage') {
                this.#buildCharacterActions()
            } else if(this.actorType === 'vehicule') {
                this.#buildVehiculeActions()
            }
        }

        /**
         * Build character actions
         * @private
         */
        #buildCharacterActions () {
            this.#buildCaracteristiques()
            this.#buildCompetences()
            this.#buildPouvoirs()
            this.#buildAttaque()            
            this.#buildDefense()            
            this.#buildVitesse()            
            this.#buildEtat()        
        }
        
        #buildVehiculeActions () {
            this.#buildCaracteristiques()
            this.#buildPouvoirs()            
        }

        async #buildCaracteristiques() {
            const actor = this.actor;

            let macroType = 'caracteristique';
            let caracteristiques = [];

            for(let car in actor.system.caracteristique) {
                let name = actor.type === 'personnage' ? game.i18n.localize(game.mm3.config.caracteristiques[car]) : game.i18n.localize(game.mm3.config.vehicule[car]);
                let encodedValue = [macroType, car].join(this.delimiter);

                caracteristiques.push({
                    name:name,
                    id:car,
                    encodedValue:encodedValue
                });
            }

            await this.addActions(caracteristiques, {id:CARACTERISTIQUE_ID, type:'system'}, true)
        }

        async #buildCompetences() {
            const actor = this.actor;
            const compActor = actor.system.competence;

            let macroType = 'competence';
            let competences = {
                base:[],
                combatcontact:[],
                combatdistance:[],
                expertise:[],
            };

            for(let comp in compActor) {
                if(comp === 'combatcontact' || comp === 'combatdistance' || comp === 'expertise') {
                    for(let l in compActor[comp].list) {
                        let data = compActor[comp].list[l];
                        let name = data.label;
                        let encodedValue = [macroType, `${comp}_${l}`].join(this.delimiter);
        
                        competences[comp].push({
                            name:name === '' ? game.i18n.localize('MM3.Adefinir') : name,
                            id:`${comp}_${l}`,
                            encodedValue:encodedValue
                        });
                    }                    
                } else {
                    let isNew = compActor[comp].new;
                    let cmp = isNew ? `${comp}_new` : comp;
                    let encodedValue = [macroType, cmp].join(this.delimiter);
                    let label = game.i18n.localize('MM3.Adefinir');

                    if(isNew) {
                        label = compActor[comp].label === '' ? label : compActor[comp].label;
                    }
    
                    competences.base.push({
                        name:isNew ? label : game.i18n.localize(game.mm3.config.competences[comp]),
                        id:`${comp}`,
                        encodedValue:encodedValue
                    });
                }
                
            }

            await this.addActions(competences.base, {id:COMPETENCE_ID, type:'system'});

            for(let main in competences) {
                const ng = main === 'base' ? {id:`competence_${main}`, type:'system'} : {id:`competence_${main}`, name:game.i18n.localize(game.mm3.config.competences[main]), type:'system'}

                if(competences[main].length > 0 && main !== 'base') {
                    await this.addGroup(ng,{id:COMPETENCE_ID, type:'system'});
                    await this.addActions(competences[main], {id:`competence_${main}`, type:'system'}, true);
                }                
            }
        }

        async #buildPouvoirs() {
            const items = this.items;
            
            let pouvoirs = [];
            let macroType = 'pouvoir';

            for(let i of items) {
                const key = i[0];
                const data = i[1];
                const type = data.type;

                if(type === 'pouvoir') {
                    let name = data.name;
                    let encodedValue = [macroType, key].join(this.delimiter);

                    pouvoirs.push({
                        name:name,
                        id:key,
                        encodedValue:encodedValue
                    });
                }
            }

            await this.addActions(pouvoirs, {id:POUVOIR_ID, type:'system'}, true);
        }

        async #buildAttaque() {
            const actor = this.actor;

            let macroType = 'attaque';
            let attaques = [];

            for(let att in actor.system.attaque) {
                const data = actor.system.attaque[att];
                let name = data.label;

                let encodedValue = [macroType, `attaque_${data._id}`].join(this.delimiter);

                attaques.push({
                    name:name === '' ? game.i18n.localize('MM3.Adefinir') : name,
                    id:data._id,
                    encodedValue:encodedValue
                });
            }

            await this.addActions(attaques, {id:ATTAQUE_ID, type:'system'}, true)
        }
        
        async #buildDefense() {
            const actor = this.actor;

            let macroType = 'defense';
            let defenses = [];

            for(let def in actor.system.defense) {
                let name = game.i18n.localize(game.mm3.config.defenses[def]);
                let encodedValue = [macroType, def].join(this.delimiter);

                defenses.push({
                    name:name,
                    id:def,
                    encodedValue:encodedValue
                });
            }

            await this.addActions(defenses, {id:DEFENSE_ID, type:'system'}, true)
        }

        async #buildVitesse() {
            const actor = this.actor;

            let macroType = 'vitesse';
            let vitesses = [];

            for(let vit in actor.system.vitesse.list) {
                let data = actor.system.vitesse.list[vit]
                let autotrade = data?.autotrade ?? false;
                let name = autotrade !== false ? game.i18n.localize(CONFIG.MM3.vitesse[autotrade]) : data.label;
                let encodedValue = [macroType, vit].join(this.delimiter);
                let isSelected = data?.selected ?? false;
                let css = isSelected ? 'selected' : '';

                vitesses.push({
                    name:name,
                    id:vit,
                    encodedValue:encodedValue,
                    cssClass:css,
                });
            }

            await this.addActions(vitesses, {id:VITESSE_ID, type:'system'}, true)
        }

        async #buildEtat() {
            const list = CONFIG.statusEffects;
            let macroType = 'etat';
            let etats = [];

            for(let eta of list) {
                let encodedValue = [macroType, eta.id].join(this.delimiter);
                let css = coreModule.api.Utils.getStatusEffect(this.actor, eta.id) ? 'selected' : '';

                etats.push({
                    name:game.i18n.localize(eta.label),
                    id:eta.id,
                    img:eta.icon,
                    encodedValue:encodedValue,
                    cssClass:css
                });
            }

            await this.addActions(etats, {id:ETAT_ID, type:'system'}, true)
        }
    }


    /**
     * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
     */
    MM3RollHandler = class RollHandler extends coreModule.api.RollHandler {
        /**
         * Handle action event
         * Called by Token Action HUD Core when an action event is triggered
         * @override
         * @param {object} event        The event
         * @param {string} encodedValue The encoded value
         */
        async handleActionClick (event, encodedValue) {
            const payload = encodedValue.split('|')

            if (payload.length !== 2) {
                super.throwInvalidValueErr()
            }

            const actionTypeId = payload[0]
            const actionId = payload[1]

            const renderable = ['item']

            if (renderable.includes(actionTypeId) && this.isRenderItem()) {
                return RollHandler.renderItem(this.actor, actionId)
            }

            const knownCharacters = ['personnage', 'vehicule'];

            // If single actor is selected
            if (this.actor) {
                await this.#handleAction(event, this.actor, this.token, actionTypeId, actionId)
                return
            }

            const controlledTokens = canvas.tokens.controlled
                .filter((token) => knownCharacters.includes(token.actor?.type))

            // If multiple actors are selected
            for (const token of controlledTokens) {
                const actor = token.actor
                await this.#handleAction(event, actor, token, actionTypeId, actionId)
            }
        }

        /**
         * Handle action
         * @private
         * @param {object} event        The event
         * @param {object} actor        The actor
         * @param {object} token        The token
         * @param {string} actionTypeId The action type id
         * @param {string} actionId     The actionId
         */
        async #handleAction (event, actor, token, actionTypeId, actionId) {
            let idDecompose;
            switch (actionTypeId) {
                case 'caracteristique':
                case 'competence':
                case 'defense':
                case 'attaque':
                    idDecompose = actionId.split('_');
                    let what = idDecompose[0];
                    let id = idDecompose?.[1] ?? "-1";

                    game.mm3.RollMacro(
                        actor._id, 
                        actor.isToken ? token?.scene?._id : 'null', 
                        actor.isToken ? actor?.token?._id : 'null',
                        actionTypeId,
                        what,
                        id,
                        actor.type,
                        event
                        );                
                break;
                case 'pouvoir':
                    game.mm3.RollMacroPwr(
                        actor._id,
                        actor.isToken ? token?.scene?._id : 'null', 
                        actor.isToken ? actor?.token?._id : 'null',
                        actionId,
                        actor.type,
                        event
                        );                
                break;
                case 'vitesse':
                    game.mm3.setSpeed(actor, actionId);
                break;
                case 'etat':
                    if(game.mm3.hasStatus(actor, actionId)) {
                        await game.mm3.deleteStatus(actor, actionId);
                    } else {
                        await game.mm3.setStatus(actor, actionId);
                    }                
                break;
            }
        }

        /**
         * Handle item action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleItemAction (event, actor, actionId) {
            const item = actor.items.get(actionId)
            item.toChat(event)
        }

        /**
         * Handle utility action
         * @private
         * @param {object} token    The token
         * @param {string} actionId The action id
         */
        async #handleUtilityAction (token, actionId) {
            switch (actionId) {
            case 'endTurn':
                if (game.combat?.current?.tokenId === token.id) {
                    await game.combat?.nextTurn()
                }
                break
            }
        }
    }

    /**
     * Extends Token Action HUD Core's SystemManager class
     */
    MM3SystemManager = class SystemManager extends coreModule.api.SystemManager {
        /**
         * Returns an instance of the ActionHandler to Token Action HUD Core
         * Called by Token Action HUD Core
         * @override
         * @returns {ActionHandler} The ActionHandler instance
         */
        getActionHandler () {
            return new MM3ActionHandler()
        }

        /**
         * Returns a list of roll handlers to Token Action HUD Core
         * Used to populate the Roll Handler module setting choices
         * Called by Token Action HUD Core
         * @override
         * @returns {object} The available roll handlers
         */
        getAvailableRollHandlers () {
            const coreTitle = 'Core MM3'
            const choices = { core: coreTitle }
            return choices
        }

        /**
         * Returns an instance of the RollHandler to Token Action HUD Core
         * Called by Token Action HUD Core
         * @override
         * @param {string} rollHandlerId The roll handler ID
         * @returns {rollHandler}        The RollHandler instance
         */
        getRollHandler (rollHandlerId) {
            return new MM3RollHandler()
        }

        /**
         * Register Token Action HUD system module settings
         * Called by Token Action HUD Core
         * @override
         * @param {function} coreUpdate The Token Action HUD Core update function
         */
        /*doRegisterSettings (coreUpdate) {
            systemSettings.register(coreUpdate)
        }*/

        /**
         * Returns the default layout and groups to Token Action HUD Core
         * Called by Token Action HUD Core
         * @returns {object} The default layout and groups
         */
        async registerDefaults () {
            const GROUP = {
                caracteristique: { id: 'caracteristique', name: `MM3.Caracteristiques`, type: 'system' },
                competence: { id: 'competence', name: `MM3.Competences`, type: 'system' },
                attaque: { id: 'attaque', name: `MM3.Attaques`, type: 'system' },
                defense: { id: 'defense', name: `tokenActionHud.template.defenses`, type: 'system' },
                pouvoir: { id: 'pouvoir', name: `MM3.Pouvoirs`, type: 'system' },
                vitesse: { id: 'vitesse', name: `MM3.VITESSE.Vitesses`, type: 'system' },
                etat: { id: 'etat', name: `tokenActionHud.template.etats`, type: 'system' },
            }

            const groups = GROUP
            Object.values(groups).forEach(group => {
                group.name = coreModule.api.Utils.i18n(group.name)
                group.listName = `Group: ${coreModule.api.Utils.i18n(group.listName ?? group.name)}`
            })
            const groupsArray = Object.values(groups)
            DEFAULTS = {
                layout: [
                    {
                        nestId: 'caracteristique',
                        id: CARACTERISTIQUE_ID,
                        name: coreModule.api.Utils.i18n('MM3.Caracteristiques'),
                        groups: [
                            { ...groups.caracteristique, nestId: 'caracteristique_caracteristique' },
                        ]
                    },
                    {
                        nestId: 'competence',
                        id: COMPETENCE_ID,
                        name: coreModule.api.Utils.i18n('MM3.Competences'),
                        groups: [
                            { ...groups.competence, nestId: 'competence_base'},
                            { ...groups.combatcontact, nestId: 'competence_combatcontact'},
                            { ...groups.combatdistance, nestId: 'competence_combatdistance'},
                            { ...groups.expertise, nestId: 'competence_expertise'},
                        ]
                    },
                    {
                        nestId: 'attaque',
                        id: ATTAQUE_ID,
                        name: coreModule.api.Utils.i18n('MM3.Attaques'),
                        groups: [
                            { ...groups.attaque, nestId: 'attaque_attaque'},
                        ]
                    },
                    {
                        nestId: 'defense',
                        id: DEFENSE_ID,
                        name: coreModule.api.Utils.i18n('tokenActionHud.template.defenses'),
                        groups: [
                            { ...groups.defense, nestId: 'defense_defense'},
                        ]
                    },
                    {
                        nestId: 'pouvoir',
                        id: POUVOIR_ID,
                        name: coreModule.api.Utils.i18n('MM3.Pouvoirs'),
                        groups: [
                            { ...groups.pouvoir, nestId: 'pouvoir_pouvoir' },
                        ]
                    },
                    {
                        nestId: 'vitesse',
                        id: VITESSE_ID,
                        name: coreModule.api.Utils.i18n('MM3.VITESSE.Vitesses'),
                        groups: [
                            { ...groups.vitesse, nestId: 'vitesse_vitesse' },
                        ]
                    },
                    {
                        nestId: 'etat',
                        id: ETAT_ID,
                        name: coreModule.api.Utils.i18n('tokenActionHud.template.etats'),
                        groups: [
                            { ...groups.etat, nestId: 'etat_etat' },
                        ]
                    },
                ],
                groups: groupsArray
            }  
            return DEFAULTS
        }
    }

    /* STARTING POINT */

    const module = game.modules.get('token-action-hud-mm3');
    module.api = {
        requiredCoreModuleVersion: '1.5',
        SystemManager: MM3SystemManager
    }    
    Hooks.call('tokenActionHudSystemReady', module)
});
