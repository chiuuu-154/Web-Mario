const {ccclass, property} = cc._decorator;

@ccclass
export default class UIManager extends cc.Component {

    // 綁定畫面上的時間 Label
    @property(cc.Label)
    timeLabel: cc.Label = null;

    // 遊戲初始時間
    private timeLeft: number = 300; 
    // 控制計時器是否運作的開關
    private isRunning: boolean = true; 

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
}