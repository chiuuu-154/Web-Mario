const {ccclass, property} = cc._decorator;
declare const firebase: any;

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

    @property({ type: cc.AudioClip })
    coinAudio: cc.AudioClip = null;

    @property({ type: cc.AudioClip })
    levelClearAudio: cc.AudioClip = null;

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

            let marioNode = cc.find("Canvas/world/Mario") || cc.find("Canvas/Mario") || cc.find("Mario");
            
            if (marioNode) {
                let marioScript = marioNode.getComponent("Mario");
                if (marioScript) {
                    console.log("TIME UP");
                    marioScript.marioDie(); // 直接呼叫馬力歐身上的死亡函數！
                }
            }
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
        if (this.coinAudio) cc.audioEngine.playEffect(this.coinAudio, false);

        UIManager.coinCount += 1;
        if (this.coinLabel) this.coinLabel.string = UIManager.coinCount.toString();
        
        this.addScore(100); 
    }

    public updateLife(lives: number) {
        if (this.lifeLabel) {
            this.lifeLabel.string = lives.toString(); 
        }
    }

    // 🌟 新增：負責將數據存回 Firebase 的靜態函數
    public static saveToFirebase(onComplete: Function) {
        // 如果沒載入 Firebase 或玩家沒登入，直接結束存檔並執行回呼函數
        if (typeof firebase === 'undefined' || !firebase.auth().currentUser) {
            console.log("未登入，跳過雲端存檔");
            if (onComplete) onComplete();
            return;
        }

        let user = firebase.auth().currentUser;
        let uid = user.uid;
        let pName = user.displayName ? user.displayName : (user.email ? user.email.split('@')[0] : "PLAYER");
        let db = firebase.database();
        let userRef = db.ref('users/' + uid); // 將資料存放在 users/玩家UID 底下

        // 1. 先讀取雲端目前的數據
        userRef.once('value').then((snapshot) => {
            let data = snapshot.val() || {};
            let cloudCoins = data.coins || 0;
            let cloudHighScore = data.highScore || 0;

            // 2. 進行結算：金幣累加、分數取最高
            let newTotalCoins = cloudCoins + UIManager.coinCount;
            let newHighScore = Math.max(cloudHighScore, UIManager.score);

            // 3. 更新回 Firebase
            return userRef.update({
                coins: newTotalCoins,
                highScore: newHighScore,
                userName: pName 
            });
        }).then(() => {
            console.log("雲端存檔成功！");
            if (onComplete) onComplete();
        }).catch((error) => {
            console.error("存檔失敗：", error);
            if (onComplete) onComplete(); // 就算失敗也要讓玩家能跳轉，不要卡死
        });
    }

    // 🌟 修改：過關結算的跳轉邏輯
    public triggerLevelClear() {
        this.isRunning = false;
        let canvasNode = cc.find("Canvas");
        if (canvasNode) {
            let bgm = canvasNode.getComponent(cc.AudioSource);
            if (bgm) {
                bgm.stop();
            }
        }
        if (this.levelClearAudio) cc.audioEngine.playEffect(this.levelClearAudio, false);
        let finalTime = Math.ceil(this.timeLeft);
        let bonusScore = finalTime * 50;

        if (this.clearTimeLabel) this.clearTimeLabel.string = finalTime.toString();
        if (this.clearScoreLabel) this.clearScoreLabel.string = bonusScore.toString();
        if (this.levelClearPanel) this.levelClearPanel.active = true;

        this.addScore(bonusScore);

        // 🌟 核心修改：等待 5 秒後，先存檔，再歸零數據並跳轉
        this.scheduleOnce(() => {
            UIManager.saveToFirebase(() => {
                UIManager.resetData(); // 存檔完畢後，把這局的分數洗掉
                cc.director.loadScene("LevelSelect");
            });
        }, 5.0);
    }

    // 🌟 5. 新增：提供給 Mario.ts 在生命歸零、Game Over 時呼叫的歸零函數
    public static resetData() {
        UIManager.coinCount = 0;
        UIManager.score = 0;
    }
}