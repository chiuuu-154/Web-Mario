const {ccclass, property} = cc._decorator;

@ccclass
export default class UIManager extends cc.Component {

    @property(cc.Label)
    timeLabel: cc.Label = null;

    @property(cc.Label)
    coinLabel: cc.Label = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    lifeLabel: cc.Label = null;

    private timeLeft: number = 302; 
    private isRunning: boolean = true; 

    // 🌟 1. 核心修改：把金幣和分數改成靜態變數 (static)，這樣關卡重開時數值才會保留！
    public static coinCount: number = 0;
    public static score: number = 0;

    onLoad () {
        if (this.timeLabel) {
            this.timeLabel.string = this.timeLeft.toString();
        }

        // 🌟 2. 新增：因為是靜態變數，關卡復活重開時，要把之前留下來的數值顯示出來！
        this.updateVisuals();
    }

    // 🌟 新增：統一刷新畫面上金幣和分數的文字顯示
    private updateVisuals() {
        if (this.coinLabel) this.coinLabel.string = UIManager.coinCount.toString();
        if (this.scoreLabel) this.scoreLabel.string = UIManager.score.toString().padStart(7, '0');
    }

    update (dt) {
        if (!this.isRunning) return;
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.isRunning = false;
        }
        if (this.timeLabel) {
            this.timeLabel.string = Math.ceil(this.timeLeft).toString();
        }
    }

    public stopTimer() {
        this.isRunning = false;
    }

    public addScore(amount: number) {
        // 🌟 3. 修改：凡是用到 score 的地方，都要改成 UIManager.score
        UIManager.score += amount;
        
        if (this.scoreLabel) {
            this.scoreLabel.string = UIManager.score.toString().padStart(7, '0');
        }
    }

    public addCoin() {
        // 🌟 4. 修改：凡是用到 coinCount 的地方，都要改成 UIManager.coinCount
        UIManager.coinCount += 1;
        if (this.coinLabel) this.coinLabel.string = UIManager.coinCount.toString();
        
        this.addScore(100); 
    }

    public updateLife(lives: number) {
        if (this.lifeLabel) {
            this.lifeLabel.string = lives.toString(); 
        }
    }

    // 🌟 5. 新增：提供給 Mario.ts 在生命歸零、Game Over 時呼叫的歸零函數
    public static resetData() {
        UIManager.coinCount = 0;
        UIManager.score = 0;
    }
}