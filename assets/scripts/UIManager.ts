const {ccclass, property} = cc._decorator;

@ccclass
export default class UIManager extends cc.Component {

    // 綁定畫面上的時間 Label
    @property(cc.Label)
    timeLabel: cc.Label = null;

    // 綁定畫面上的金幣和分數 Label
    @property(cc.Label)
    coinLabel: cc.Label = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    // 遊戲初始時間
    private timeLeft: number = 300; 
    // 控制計時器是否運作的開關
    private isRunning: boolean = true; 

    // 新增：記錄目前的金幣和分數
    private coinCount: number = 0;
    private score: number = 0;

    onLoad () {
        // 遊戲一開始先強制作為 300 顯示
        if (this.timeLabel) {
            this.timeLabel.string = this.timeLeft.toString();
        }
    }

    update (dt) {
        // 如果計時器沒在跑 (例如碰到旗子了)，就不執行倒數
        if (!this.isRunning) return;

        // dt 是兩幀之間的時間差 (大約 0.016 秒)，不斷扣除就是真實時間倒數
        this.timeLeft -= dt;

        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.isRunning = false;
            // TODO: 之後可以在這裡觸發「時間到，瑪利歐死亡」的函數
        }

        // 使用 Math.ceil (無條件進位) 讓 UI 只顯示整數
        // 這樣 299.9 秒時 UI 還是顯示 300，直到低於 299 才會變成 299
        if (this.timeLabel) {
            this.timeLabel.string = Math.ceil(this.timeLeft).toString();
        }
    }

    // 這個函數是預留給「瑪利歐碰到旗子」時呼叫的
    public stopTimer() {
        this.isRunning = false;
    }

    // 🌟 新增：單純加分的函數（吃蘑菇、踩怪物都可以呼叫這個）
    public addScore(amount: number) {
        this.score += amount;
        
        // 刷新分數顯示 (補滿 6 位數)
        if (this.scoreLabel) {
            this.scoreLabel.string = this.score.toString().padStart(7, '0');
        }
    }

    // 🪙 原有的加金幣函數（重構成呼叫 addScore）
    public addCoin() {
        this.coinCount += 1;
        if (this.coinLabel) this.coinLabel.string = this.coinCount.toString();
        
        // 🌟 金幣本身價值 100 分，直接呼叫上面的加分函數
        this.addScore(100); 
    }
}