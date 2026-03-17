import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card{
    constructor(name, power, image){
        super(name, power, image);
    }

    getDescriptions(){
        return [
            getCreatureDescription(this),
            super.getDescriptions()
        ];
    }
}

// Новые классы карт
class Duck extends Creature {
    constructor() {
        super('Мирная утка', 2);
    }
    
    quacks() {
        console.log('quack');
    }
    
    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor(name = 'Пес-бандит', power = 3) {
        super(name, power);
    }
}

class Trasher extends Dog {
    constructor() {
        super('Громила', 5);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const reducedValue = Math.max(value - 1, 0);
        
        this.view.signalAbility(() => {
            continuation(reducedValue);
        });
    }

    getDescriptions() {
        return [
            ...super.getDescriptions(),
            'Получает на 1 меньше урона'
        ];
    }
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }
    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
    
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const oppositeTable = oppositePlayer.table;
        for(let position = 0; position < oppositeTable.length; position++) {

            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                const oppositeCard = oppositePlayer.table[position];
    
                if (oppositeCard) {
                    this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                }
            });
        }
    
        taskQueue.continueWith(continuation);
    }

    getDescriptions() {
        return [
            ...super.getDescriptions(),
            'наносит 2 урона по очереди всем картам противника на столе, но не атакует игрока-противника'
        ];
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        super.doAfterComingIntoPlay(gameContext, continuation);
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        super.doBeforeRemoving(continuation);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        const bonus = Lad.getBonus();
        continuation(value + bonus);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const bonus = Lad.getBonus();
        const reducedValue = Math.max(value - bonus, 0);
        
        if (bonus > 0) {
            this.view.signalAbility(() => {
                continuation(reducedValue);
            });
        } else {
            continuation(reducedValue);
        }
    }

    getDescriptions() {
        const descriptions = super.getDescriptions();
        
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') || 
            Lad.prototype.hasOwnProperty('modifyTakenDamage')) {
            descriptions.push('Чем их больше, тем они сильнее');
        }
        
        return descriptions;
    }
}

// Обновленные функции проверки
function isDuck(card) {
    return card && typeof card.quacks === 'function' && typeof card.swims === 'function';
}

function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Gatling(),
];
const banditStartDeck = [
    new Trasher(),
    new Dog(),
    new Dog(),
];

// Создание игры с новыми колодами
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(2);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
