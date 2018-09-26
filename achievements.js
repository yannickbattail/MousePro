/*
*
* Mouse Pro
*
* Achievements.js
*/

Achievements = {};

(function (Achievements) {

	EventNode = document.getElementById('eventNode');

	Achievements.achievements = [
		{
			name: 'Mover Noob',
			shortName: 'mover',
			description: 'Reach level 1 in Mouse Mover',
			acquired: false
		}
	];
	
	Achievements.achievement = function(shortName) {
		return Achievements.achievements.filter(a => a.shortName == shortName)[0];
	}
	
	Achievements.gain = function(achievementShortName) {
		let ach = Achievements.achievement(achievementShortName);
		ach.acquired = true;
		let event = new CustomEvent('achievementGained', { detail: { achievement: ach }})
		EventNode.dispatchEvent(event);
	}
	
	Achievements.has = function(achievementShortName) {
		let ach = Achievements.achievement(achievementShortName);
		return ach.acquired;
	}

})(gameObjects.Achievements);