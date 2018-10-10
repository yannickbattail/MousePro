/*
*
* Mouse Pro
*
* Save.js
*/

(function(Display, Game, Friends, Shop, Achievements, Tabs, Save) {

    Save.toto = "true";

    Save.generateSaveGame = function() {
        
        let saveCurrencies = [];
        for (c in Game.currencies) {
            if (Game.currencies.hasOwnProperty(c)) {
                saveCurrencies.push({shortName: Game.currencies[c].shortName, saveableState: Game.currencies[c].saveableState });
            }
        }
        let saveTabs = [];
        for (t in Tabs.tabs) {
            if (Tabs.tabs.hasOwnProperty(t)) {
                saveTabs.push({shortName: Tabs.tabs[t].shortName, saveableState: Tabs.tabs[t].saveableState });
            }
        }
        let saveBoosts = [];
        for (b in Shop.boosts) {
            if (Shop.boosts.hasOwnProperty(b)) {
                saveBoosts.push({shortName: Shop.boosts[b].shortName, saveableState: Shop.boosts[b].saveableState });
            }
        }
        let saveFriends = [];
        for (f in Friends.friends) {
            if (Friends.friends.hasOwnProperty(f)) {
                saveFriends.push({shortName: Friends.friends[f].shortName, saveableState: Friends.friends[f].saveableState });
            }
        }
        let acquiredAchievements = [];
        for (a in Achievements.achievements) {
            if (Achievements.achievements.hasOwnProperty(a)) {
                if (Achievements.achievements[a].acquired) {
                    acquiredAchievements.push(Achievements.achievements[a].shortName);
                }
            }
        }

        let saveGame = {
            Tabs: saveTabs,
            Currencies: saveCurrencies,
            Boosts: saveBoosts,
            Friends: saveFriends,
            AcquiredAchievements: acquiredAchievements
        };

        return saveGame;
    }

    Save.saveGame = function() {
        let saveGame = Save.generateSaveGame();

        localStorage.setItem('saveGame', JSON.stringify(saveGame));

        Display.notify('Game saved');
    }

    Save.loadGame = function() {
        let localSave = localStorage.getItem('saveGame')
        if (localSave == undefined) return ;
        
        let saveGame = JSON.parse(localSave);
        Save.applySave(saveGame);
    }

    Save.applySave = function(saveGame){
        let saveCurrencies = saveGame.Currencies;
        for (c in saveCurrencies) {
            if (saveCurrencies.hasOwnProperty(c)) {
                let currency = Game.currency(saveCurrencies[c].shortName);
                currency.saveableState = saveCurrencies[c].saveableState;
            }
        }
        let saveTabs = saveGame.Tabs;
        for (t in saveTabs) {
            if (saveTabs.hasOwnProperty(t)) {
                let tab = Tabs.tab(saveTabs[t].shortName);
                tab.saveableState = saveTabs[t].saveableState;
            }
        }
        let saveBoosts = saveGame.Boosts;
        for (b in saveBoosts) {
            if (saveBoosts.hasOwnProperty(b)) {
                let boost = Shop.boost(saveBoosts[b].shortName);
                boost.saveableState = saveBoosts[b].saveableState;
            }
        }
        let saveFriends = saveGame.Friends;
        for (f in saveFriends) {
            if (saveFriends.hasOwnProperty(c)) {
                let friend = Friends.friend(saveFriends[f].shortName);
                friend.saveableState = saveFriends[f].saveableState;
            }
        }
        let acquiredAchievements = saveGame.AcquiredAchievements;
        for (a in acquiredAchievements) {
            if (acquiredAchievements.hasOwnProperty(a)) {
                Achievements.achievement(acquiredAchievements[a]).acquired = true;
            }
        }

        Display.refreshShop();
        Display.refreshTabs();
        Display.displayActiveTab();
        Display.refreshFriends();
        Display.refreshBoostsOwned();
        Display.notify('Game loaded');
    }

    Save.resetSave = function() {
        let ok = confirm('Are you sure you want to wipe your save?');
        if (!ok) return;
        
        localStorage.removeItem('saveGame');
        window.location.reload();
    }

    Save.exportSave = function() {
        let saveGame = Save.generateSaveGame();

        prompt("Your saved game:", btoa(JSON.stringify(saveGame)));
    }

    Save.importSave = function() {
        let saveBase64 = prompt("Paste your save:", '');
        if (saveBase64 == null || saveBase64 == '') return;

        let saveGame = JSON.parse(atob(saveBase64));
        Save.applySave(saveGame);
    }

    setInterval(Save.saveGame, 10000);

    Save.loadGame();

})(gameObjects.Display, gameObjects.Game, gameObjects.Friends, gameObjects.Shop, gameObjects.Achievements, gameObjects.Tabs, gameObjects.Save);