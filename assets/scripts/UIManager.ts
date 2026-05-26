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

    // 🌟 1. 新增：綁定結算畫面的相關節點
    @property(cc.Node)
    levelClearPanel: cc.Node = null; // 剛剛打包的那整包結算 UI

    @property(cc.Label)
    clearTimeLabel: cc.Label = null; // 綁定 "clearTime" 節點

    @property(cc.Label)
    clearScoreLabel: cc.Label = null; // 綁定 "clearscore" 節點

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

    public triggerLevelClear() {
        // 1. 停止計時器
        this.isRunning = false;

        // 2. 抓出剩餘時間 (無條件進位)
        let finalTime = Math.ceil(this.timeLeft);

        // 3. 計算時間紅利 (時間 * 50)
        let bonusScore = finalTime * 50;

        // 4. 更新過關畫面上的數字
        if (this.clearTimeLabel) {
            this.clearTimeLabel.string = finalTime.toString();
        }
        if (this.clearScoreLabel) {
            this.clearScoreLabel.string = bonusScore.toString();
        }

        // 5. 把整包結算 UI 顯示出來！
        if (this.levelClearPanel) {
            this.levelClearPanel.active = true;
        }

        // 6. 把紅利加回原本左上角的總分！(呼叫我們之前寫好的 addScore)
        this.addScore(bonusScore);
    }

    // 🌟 5. 新增：提供給 Mario.ts 在生命歸零、Game Over 時呼叫的歸零函數
    public static resetData() {
        UIManager.coinCount = 0;
        UIManager.score = 0;
    }
}