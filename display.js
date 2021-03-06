/*
*
* Mouse Pro
*
* Display.js
*/

(function (Game, Achievements, Shop, Friends, Tabs, Stats, Display) {

	Display.tickInterval = null;
	Display.tickIntervalValue = 10;
	Display.ticks = 0;
	
	Display.needsRepaintImmediate = false;

	Display.framesPerSecond = function() {
		return 1000.0 / Display.tickIntervalValue;
	}
	
	Display.updateCurrencies = function() {
		Game.currencies.filter(c => c.isToBeDisplayedNormally).forEach(Display.updateCurrency);
	}
	
	Display.updateCurrency = function(currency) {
		let xpDiv = document.getElementById('currency-'+currency.shortName+'-xp');
		xpDiv.innerHTML = Display.beautify(currency.getXp()) + ' / ' + Display.beautify(currency.xpRequiredForNextLevel());
		
		let currencyLevel = document.getElementById('currency-'+currency.shortName+'-level');
		currencyLevel.innerHTML = '<span>' + currency.iconTag + '&nbsp;' + currency.shortName + ' (' + currency.getLevel() + ') XP:</span>';
		
		let progressBar = document.getElementById('currency-' + currency.shortName + '-bar');
		let progressPercent = Game.currencyProgressPercent(currency.shortName);
		progressBar.style = 'width: '+progressPercent+'%;--currency-color: ' + currency.color;
	}
	
	Display.beautify = function(value) {
		let negative = value < 0 ? '-' : '';

		value = Math.round(Math.abs(value));
		if (value <= 5000) return negative + value;
		
		let postFixedValue = value.toExponential(2).replace(/e\+/, ' e');
		let postFixes = [
			{ divisor: 1e3,  postFix: 'K'},
			{ divisor: 1e6,  postFix: 'M'},
			{ divisor: 1e9,  postFix: 'B'},
			{ divisor: 1e12, postFix: 'T'},
			{ divisor: 1e15, postFix: 'Qa'},
			{ divisor: 1e18, postFix: 'Qi'},
			{ divisor: 1e21, postFix: 'Sx'},
			{ divisor: 1e24, postFix: 'Sp'},
			{ divisor: 1e27, postFix: 'Oc'},
			{ divisor: 1e30, postFix: 'No'},
			{ divisor: 1e33, postFix: 'Dc'}
		]
		let postFixIndex = 0;
		while (postFixIndex < (postFixes.length - 1)
			&& postFixes[postFixIndex + 1].divisor <= value) {
			 postFixIndex++;
		}
		if (postFixIndex != postFixes.length - 1)
		{
			let postFixData = postFixes[postFixIndex];
			postFixedValue = (value / postFixData.divisor).toFixed(2) + ' ' + postFixData.postFix;
		}

		return negative + postFixedValue;
	}
	
	Display.tick = function() {
		Display.updateCurrencies();
		Display.updateNotifs();
		Display.refreshDisplayModules();
		Display.ticks++;
		if (Display.ticks == 50 || Display.needsRepaintImmediate) {
			Display.ticks = 0;
			Display.needsRepaintImmediate = false;
			Display.refreshShop();
			Display.refreshTabs();
			Display.refreshFriends();
			Display.refreshBoostsOwned();
			Display.refreshAchievements();
			Stats.refreshStats();
		}
		Game.tick();
	}
	
	Display.startTicking = function() {
		this.tickInterval = setInterval(this.tick, Display.tickIntervalValue);
	}
	
	Display.initialize = function() {
		this.bindEvents();
		this.displayCurrencies();
	}
	
	Display.bindEvents = function() {
		document.onmousedown = Game.onclick;
		document.onmousemove = Game.onmousemove;
	}
	
	Display.notifyLevelUp = function(currency) {
		let msg = 'Level Up ! ' + currency.name + ' is now level ' + currency.getLevel() + '!';
		if (currency.getLevel() <= currency.getHighestLevelAttained())
		{
			if (!Achievements.has('again'))
				Achievements.gain('again');
			msg += ' ... again';
		}
		Display.notify(msg, 'levelup'+currency.shortName);
	}
	
	Display.displayCurrencies = function () {
		let ul = document.getElementById('currencies');
		
		Game.currencies.filter(c => c.isToBeDisplayedNormally).forEach((currency) => {
			let currencyDiv = this.buildDisplayItemForCurrency(currency);
			ul.appendChild(currencyDiv);
		});
	}
	
	Display.refreshShop = function () {
		let ul = document.getElementById('shop');
		let shopBoosts = [...ul.getElementsByClassName('boost')];

		let boosts = Shop.boosts.filter(b => b.isUnlocked());
		if (boosts.length == 0)
			ul.parentElement.parentElement.style.display = 'none';
		else
			ul.parentElement.parentElement.style.display = '';

		shopBoosts.forEach((shopBoost) => {
			let boost = boosts.filter(b => 'boost-' + b.shortName == shopBoost.id);
			if (boost.length == 0) {
				ul.removeChild(shopBoost);
				return;
			}
		});
		boosts.forEach((boost) => {
			let shopBoost = shopBoosts.filter(sb => sb.id == 'boost-' + boost.shortName);
			if (shopBoost.length == 0) {
				let boostItem = Display.buildDisplayItemForBoost(boost);
				ul.appendChild(boostItem);
			} else {
				shopBoost = shopBoost[0];
				let descDiv = shopBoost.getElementsByClassName('boost-desc')[0];
				descDiv.innerHTML = boost.getDescription();
				let ephemeralDiv = shopBoost.getElementsByClassName('boost-ephemeral');
				if (ephemeralDiv.length > 0){
					ephemeralDiv = ephemeralDiv[0];
					ephemeralDiv.innerHTML = boost.getEphemeralDescription(Display);
				}
				let buyButton = shopBoost.getElementsByClassName('boost-buy-btn')[0];
				if (!Game.hasCurrency(boost.getCost()) || !boost.canBuy())
					buyButton.classList.add('disabled');
				else
					buyButton.classList.remove('disabled');
			}
		});
	}
	
	Display.refreshAchievements = function() {
		let ul = document.getElementById('achievements');
		while (ul.firstChild) {
			ul.removeChild(ul.firstChild);
		}
		
		let ach = Achievements.achievements;
		if (ach.length == 0) return;

		ach.forEach((achievement) => {
			let achievementItem = Display.buildDisplayItemForAchievement(achievement);
			ul.appendChild(achievementItem);
		});
	}

	Display.refreshDisplayModules = function() {
		Display.modules.forEach((mod) => {
			mod.displayModule.refresh();
		})
	}

	Display.buildDisplayItemForAchievement = function(achievement) {
		let mainDiv = document.createElement('div');
		mainDiv.classList = ['achievement'];
		if (!achievement.acquired)
			mainDiv.classList.add('locked');
		mainDiv.id = 'achievement-' + achievement.shortName;
		
		let titleDiv = document.createElement('div');
		titleDiv.className = 'achievement-title';
		titleDiv.innerHTML = achievement.name;
		
		let descDiv = document.createElement('div');
		descDiv.className = 'achievement-desc';
		descDiv.innerHTML = achievement.description;
		
		mainDiv.appendChild(titleDiv);
		mainDiv.appendChild(descDiv);

		return mainDiv;
	}
	
	let refreshes = 0;
	Display.refreshBoostsOwned = function() {
		let ul = document.getElementById('owned');
		refreshes++;
		if (refreshes === 10) {
			ul.innerHTML = '';
			refreshes = 0;
		}
		let ownedBoosts = [...ul.getElementsByClassName('boost')];

		let boosts = Shop.boosts.filter(b => b.isBought() && !b.isUnlocked());
		if (boosts.length == 0)
			ul.parentElement.parentElement.style.display = 'none';
		else
			ul.parentElement.parentElement.style.display = '';

		ownedBoosts.forEach((ownedBoost) => {
			let boost = boosts.filter(b => 'boost-' + b.shortName == ownedBoost.id);
			if (boost.length == 0) {
				ul.removeChild(ownedBoost);
				return;
			} else {
				boost = boost[0];
				let descDiv = ownedBoost.getElementsByClassName('boost-desc')[0];
				descDiv.innerHTML = boost.getDescription();
				if (boost.getIcon() !== undefined) {
					let iconDiv = ownedBoost.getElementsByClassName('boost-icon')[0];
					if (iconDiv === undefined){
						iconDiv = document.createElement('div');
						descDiv.parentNode.insertBefore(iconDiv, descDiv);
					}
					iconDiv.className = 'boost-icon fa fa-' + boost.getIcon();
						
				}
				if (boost.isActive()) {
					ownedBoost.classList.remove('inactive');
					ownedBoost.classList.add('active');
				} else {
					ownedBoost.classList.add('inactive');
					ownedBoost.classList.remove('active');
				}

				if (boost.hasXP) {
					let xpDiv = ownedBoost.getElementsByClassName('boost-xp')[0];
					xpDiv.style.width = boost.getFullnessPercent() + '%';
				}
			}
		});
		boosts.sort((a, b) => { if (a.isActivable) return -1; if (b.isActivable) return 1; if (a.hasXP) return -1; if (b.hasXP) return 1; return 0; } ).forEach((boost) => {
			let ownedBoost = ownedBoosts.filter(sb => sb.id == 'boost-' + boost.shortName);
			if (ownedBoost.length == 0) {
				let boostItem = Display.buildDisplayItemForBoost(boost);
				ul.appendChild(boostItem);
			}
		});
	}

	Display.buildDisplayItemForBoost = function(boost) {
		let mainDiv = document.createElement('div');
		mainDiv.classList = [ 'boost' ];
		if (boost.isActivable) {
			mainDiv.classList.add('activable');
		}
		if (boost.ephemeral) {
			mainDiv.classList.add('ephemeral');
		}
		mainDiv.id = 'boost-' + boost.shortName;
		
		let titleDiv = document.createElement('div');
		titleDiv.className = 'boost-title';
		titleDiv.innerHTML = boost.name;
		mainDiv.appendChild(titleDiv);

		if (boost.getIcon() != undefined) {
			let iconDiv = document.createElement('div');
			iconDiv.className = 'boost-icon fa fa-' + boost.getIcon();
			mainDiv.appendChild(iconDiv);
		}
		
		let descDiv = document.createElement('div');
		descDiv.className = 'boost-desc';
		descDiv.innerHTML = boost.getDescription();
		mainDiv.appendChild(descDiv);

		if (boost.ephemeral == true) {
			ephemeralDiv = document.createElement('div');
			ephemeralDiv.className = 'boost-ephemeral';
			ephemeralDiv.innerHTML = boost.getEphemeralDescription(Display);
			mainDiv.appendChild(ephemeralDiv);
		}

		if (boost.isUnlocked()) {
			let costDiv = document.createElement('div');
			costDiv.className = 'boost-cost';
			costDiv.innerHTML = 'Cost:';
			costDiv.appendChild(Display.buildCostListForCost(boost.cost));
			mainDiv.appendChild(costDiv);

			let buyButton = document.createElement('div');
			buyButton.classList = ['boost-buy-btn'];
			buyButton.innerHTML = boost.buyButtonLabel;
			if (!Game.hasCurrency(boost.getCost()) || !boost.canBuy())
				buyButton.classList.add('disabled');
			buyButton.addEventListener('click', function() { Shop.buy(boost.shortName) });

			mainDiv.appendChild(buyButton);
		}
		
		if (boost.isActive()) {
			mainDiv.classList.remove('inactive');
			mainDiv.classList.add('active');
		} else {
			mainDiv.classList.add('inactive');
			mainDiv.classList.remove('active');
		}

		if (boost.isLoot) {
			let lootLabel = document.createElement('div');
			lootLabel.classList = ['boost-loot-label'];
			lootLabel.innerHTML = '<i class="fa-loot"></i> Loot!';
			mainDiv.appendChild(lootLabel);
		}

		if (boost.hasXP) {
			let xpDiv = document.createElement('div');
			xpDiv.className = 'boost-xp';
			xpDiv.style.width = boost.getFullnessPercent() + '%';
			xpDiv.style.backgroundColor = boost.xpBarColor;
			mainDiv.appendChild(xpDiv);
		}
		
		return mainDiv;
	}

	Display.refreshFriends = function() {
		let friends = Friends.friends.filter(f => f.canBuy());
		if (friends.length == 0) return;

		let ul = document.getElementById('friends');
		let unlockedFriends = [...ul.getElementsByClassName('friend')];
		ul.parentElement.style.display = '';
		
		unlockedFriends.forEach((unlockedFriend) => {
			let friend = friends.filter(f => 'friend-' + f.shortName == unlockedFriend.id);
			if (friend.length == 0) {
				ul.removeChild(unlockedFriend);
				return;
			}
			friend = friend[0];
			let costDiv = unlockedFriend.getElementsByClassName('friend-cost')[0];
			let costList = costDiv.getElementsByClassName('cost-list')[0];
			costDiv.removeChild(costList);
			costDiv.appendChild(Display.buildCostListForCost(friend.getCosts()));
		});
		friends.forEach((friend) => {
			let unlockedFriend = unlockedFriends.filter(sb => sb.id == 'friend-' + friend.shortName);
			if (unlockedFriend.length == 0) {
				let friendItem = Display.buildDisplayItemForFriend(friend);
				ul.appendChild(friendItem);
			} else {
				unlockedFriend = unlockedFriend[0];

				let title = unlockedFriend.getElementsByClassName('friend-title')[0];
				title.innerHTML = friend.getName();

				let iconDiv = unlockedFriend.getElementsByClassName('friend-icon')[0];		
				if (Shop.has('bloodfull' + friend.shortName)) {
					iconDiv.classList.add('red');
					iconDiv.classList.add('red-glow');
				}
						
				let desc = unlockedFriend.getElementsByClassName('friend-desc')[0];
				desc.innerHTML = friend.getDescription();
				
				let buyButton = unlockedFriend.getElementsByClassName('friend-buy-btn')[0];
				if (!Game.hasCurrency(friend.getCosts()))
					buyButton.classList.add('disabled');
				else 
					buyButton.classList.remove('disabled');

				let bloodDiv = unlockedFriend.getElementsByClassName('friend-blood-xp')[0];
				bloodDiv.style.width = friend.getFullnessPercent() + '%';
			}
		});
	}

	Display.buildDisplayItemForFriend = function(friend) {
		let mainDiv = document.createElement('div');
		mainDiv.className = 'friend';
		mainDiv.id = 'friend-' + friend.shortName;

		let titleDiv = document.createElement('div');
		titleDiv.className = 'friend-title';
		titleDiv.innerHTML = friend.getName();
		mainDiv.appendChild(titleDiv);

		if (friend.icon != undefined) {
			let iconDiv = document.createElement('div');
			iconDiv.className = 'friend-icon fa fa-' + friend.icon;
			if (Shop.has('bloodfull' + friend.shortName))
				iconDiv.className += ' red red-glow';
			mainDiv.appendChild(iconDiv);
		}
		
		let descDiv = document.createElement('div');
		descDiv.className = 'friend-desc';
		descDiv.innerHTML = friend.getDescription();
		mainDiv.appendChild(descDiv);
		
		let costDiv = document.createElement('div');
		costDiv.className = 'friend-cost';
		costDiv.innerHTML = 'Cost:';
		costDiv.appendChild(Display.buildCostListForCost(friend.getCosts()));
		mainDiv.appendChild(costDiv);
		
		let buyButton = document.createElement('div');
		buyButton.classList = ['friend-buy-btn'];
		buyButton.innerHTML = 'Buy';
		if (!Game.hasCurrency(friend.getCosts()))
			buyButton.classList.add('disabled');
		buyButton.onclick = function() { Friends.buy(friend.shortName) };
		mainDiv.appendChild(buyButton);

		let bloodDiv = document.createElement('div');
		bloodDiv.className = 'friend-blood-xp';
		bloodDiv.style.width = friend.getFullnessPercent() + '%';
		mainDiv.appendChild(bloodDiv);
		
		return mainDiv;
	}
	
	Display.buildCostListForCost = function(cost) {
		let ul = document.createElement('ul');
		ul.className = 'cost-list';
		
		if (cost.xp) {
			for (let part in cost.xp) {
				if (cost.xp.hasOwnProperty(part)) {
					let li = document.createElement('li');
					let currency = Game.currency(part);
					li.innerHTML = currency.iconTag + '&nbsp;' + part + ': ' + cost.xp[part] + ' ' + currency.xpLabel;
					ul.appendChild(li);
				}
			}
		}
		if (cost.levels) {
			for (let part in cost.levels) {
				if (cost.levels.hasOwnProperty(part)) {
					let li = document.createElement('li');
					let currency = Game.currency(part);
					li.innerHTML = currency.iconTag + '&nbsp;' +part + ': ' + cost.levels[part] + ' ' + currency.levelsLabel;
					ul.appendChild(li);
				}
			}
		}
		
		return ul;
	}
	
	Display.buildDisplayItemForCurrency = function(currency) {
		let div = document.createElement('div');
		div.className = 'currency';
		div.id = 'currency-' + currency.shortName;
		
		let progressBar = document.createElement('div');
		progressBar.style = 'width: 0%;--currency-color: ' + currency.color;
		progressBar.className = 'currency-progressBar';
		progressBar.id = 'currency-' + currency.shortName + '-bar';
		
		div.appendChild(progressBar);
		
		let currencyData = document.createElement('div');
		currencyData.className = 'currency-data';
		
		let currencyLevel = document.createElement('div');
		currencyLevel.id = 'currency-'+currency.shortName+'-level';
		currencyLevel.className = 'currency-level';
		currencyLevel.innerHTML = '<span>' + currency.shortName + ' (' + currency.getLevel() + ')</span>';
		
		currencyData.appendChild(currencyLevel);
		
		let xpDiv = document.createElement('div');
		xpDiv.id = 'currency-'+currency.shortName+'-xp';
		xpDiv.innerHTML = currency.getXp() + ' / ' + currency.xpRequiredForNextLevel();
		xpDiv.className = 'currency-xp';
		
		currencyData.appendChild(xpDiv);
		
		div.appendChild(currencyData);
		let listItem = document.createElement('li');
		listItem.appendChild(div);
		
		return listItem;
	}

	Display.refreshTabs = function() {
		let ul = document.getElementById('tabs');

		let tabs = Tabs.tabs.filter(t => t.isUnlocked());
		if (tabs.length == 0) return;

		let tabBtns = [...ul.getElementsByClassName('tab-btn')];
		ul.parentElement.style.display = '';

		tabBtns.forEach((tabBtn) => {
			if (tabs.filter(t => t.shortName == tabBtn.getAttribute('data-target')).length == 0)
				ul.removeChild(tabBtn);
		});
		tabs.forEach((tab) => {
			if (tabBtns.filter(t => t.getAttribute('data-target') == tab.shortName).length == 0) {
				let div = document.createElement('div');
				div.className = 'tab-btn' + (tab.isActive() ? ' tab-active' : '');
				div.setAttribute('data-target', tab.shortName);
				div.innerHTML = tab.label;
				div.onclick = (function (shortName) {
					return function() { 
						Tabs.toggleActiveTabTo(shortName);
						Display.displayActiveTab();
					};
				})(tab.shortName);
				ul.appendChild(div);
			}
		});
	}

	Display.displayActiveTab = function() {
		let shortName = Tabs.getActiveTab();
		let tabs = document.getElementsByClassName('tab');

		[...tabs].forEach((tabDiv) => {
			if (tabDiv.id == 'tab-' + shortName) {
				tabDiv.classList.add('tab-active');
			} else {
				tabDiv.classList.remove('tab-active');
			}
		});

		let tabBtns = document.getElementsByClassName('tab-btn');

		[...tabBtns].forEach((tabBtnDiv) => {
			if (tabBtnDiv.getAttribute('data-target') == shortName) {
				tabBtnDiv.classList.add('tab-active');
			} else {
				tabBtnDiv.classList.remove('tab-active');
			}
		});
	}
	
	Display.notifyAchievementGained = function(ach) {
		let achievementGainedMsg = "You gained an achievement ! ";
		achievementGainedMsg += ach.name + ": " + ach.description;
		Display.notify(achievementGainedMsg, 'achievement');
	}
	
	Display.notifyLoot = function(lootedBoost) {
		Display.notify('You found something', 'loot');
		Display.notify(Shop.boost(lootedBoost).name + ' unlocked', 'loot');
	}
	
	Display.notifs = [];
	Display.notifsY = 0;
	Display.notifsX = 0;
	Display.logArchive = {};
	Display.notify = function(msg, category) {

		let x = Math.floor(window.innerWidth / 2);
		let y = Math.floor(window.innerHeight * 0.95);

		let notif = {
			category: category,
			targetX: x,
			targetY: y - 750,
			opacity: 100,
			x: x,
			y: y,
			frame: 0,
			totalFrames: Display.framesPerSecond() * 3,
			div: document.createElement('div')
		};
		
		notif.div.className = 'notif';
		notif.div.innerHTML = msg;
		notif.div.style.position = 'absolute';
		
		Display.queueNotif(notif);
	}
	
	Display.notifQueue = [];
	Display.animatedNotifs = [];
	Display.nextNotifAvailableOn = undefined;
	Display.queueNotif = function(notif) {
		Display.notifQueue = Display.notifQueue.filter(n => n.category != notif.category);
		Display.animatedNotifs = Display.animatedNotifs.filter(n => n.category != notif.category);
		Display.notifQueue.push(notif);
		if (Display.notifQueue.length > 50)
			Display.notifQueue.shift();
	}
	
	Display.updateNotifs = function() {
		if (Display.notifQueue.length === 0) return;
		
		let now = new Date();
		if (!Display.nextNotifAvailableOn
			|| now.getTime() >= Display.nextNotifAvailableOn)
		{
			notif = Display.notifQueue.shift();
			Display.animatedNotifs.push(notif);
			Display.animateNotif(notif);
			Display.nextNotifAvailableOn = now.getTime() + 400;
		}
	}
	
	Display.animateNotif = function(notif) {

		if (Display.animatedNotifs.indexOf(notif) == -1) {
			document.getElementsByTagName('body')[0].removeChild(notif.div);
			return;
		}
		
		let xSway = 25;

		if (notif.frame === 0) {
			notif.moveVector = { x: notif.x, y: 0, targetY: notif.y-notif.targetY };
			notif.moveVector.y = (notif.targetY - notif.y) / notif.totalFrames;
			notif.opacityVector = -notif.opacity / notif.totalFrames;
			document.getElementsByTagName('body')[0].appendChild(notif.div);
		}
		
		notif.frame++;
		notif.x = notif.moveVector.x + (xSway * Math.sin((3*(notif.targetY - notif.y)*Math.PI)/notif.moveVector.targetY));
		notif.y += notif.moveVector.y;
		notif.opacity += notif.opacityVector;
		notif.div.style.top = notif.y + 'px';
		notif.div.style.left = notif.x + 'px';
		notif.div.style.opacity = notif.opacity / 100.0;
		
		if (notif.frame < notif.totalFrames)
		{
			setTimeout(function() { Display.animateNotif(notif); }, Display.tickIntervalValue);
		} else {
			notif.div.remove();
		}
	}

    Display.switchMode = function() {
		let body =  document.getElementsByTagName('body')[0];
		if (body.className == 'dark-theme') {
			body.className = 'origin-theme';
		} else {
			body.className = 'dark-theme';
		}
	}
	
	Display.displaySaveExport = function(save) {
		let mainDiv = document.getElementById('saveExport');
		mainDiv.style.display = '';
		let textArea = document.getElementById('saveExportText');
		textArea.value = save;
	}
	
	Display.closeSaveExport = function() {
		let mainDiv = document.getElementById('saveExport');
		mainDiv.style.display = 'none';
	}
	
	Display.changeFont = function() {
		let body = document.getElementsByTagName('body')[0];

		let gameFont = document.getElementById('gameFont').value;

		body.setAttribute('gameFont', gameFont);
	}

	Display.initialize();
	
	Display.startTicking();

})(gameObjects.Game, gameObjects.Achievements, gameObjects.Shop, gameObjects.Friends, gameObjects.Tabs, gameObjects.Stats, gameObjects.Display);