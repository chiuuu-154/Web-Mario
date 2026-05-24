const {ccclass, property} = cc._decorator;

// 定義一個下拉選單，讓你在編輯器可以直接選擇這個方塊要噴什麼！
export enum BlockType {
    COIN = 0,
    MUSHROOM = 1
}

@ccclass
export default class QuestionBlock extends cc.Component {

    // 在屬性面板顯示下拉選單
    @property({ type: cc.Enum(BlockType) })
    blockType: BlockType = BlockType.COIN;

    // 撞擊後變成「空磚塊 (咖啡色)」的圖片
    @property(cc.SpriteFrame)
    emptyBlockSprite: cc.SpriteFrame = null;

    // 🌟 1. 改名與新增：讓你可以把金幣和「分數Label」的預製體拖進來
    @property(cc.Prefab)
    coinPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    scoreLabelPrefab: cc.Prefab = null; // 用於彈出「100」分數文字的預製體

    private isHit: boolean = false; // 是否已經被撞過了
    private startY: number = 0;     // 記錄方塊的初始高度

    onLoad() {
        // 記住一開始的 Y 座標，這樣彈完才能回到原位
        this.startY = this.node.y;
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.isHit) return;

        // 🌟 防呆：記得確認你的瑪利歐名字叫 MarioSmall
        if (otherCollider.node.name !== "MarioSmall") return;

        let mario = otherCollider.node;
        let marioVelocityY = mario.getComponent(cc.RigidBody).linearVelocity.y;
        
        let marioBox = mario.getBoundingBoxToWorld();
        let blockBox = this.node.getBoundingBoxToWorld();

        // 不要比腳底，比「中心點」更安全！
        let marioCenterY = marioBox.yMin + (marioBox.height / 2);
        let blockCenterY = blockBox.yMin + (blockBox.height / 2);

        // 寬鬆判定：瑪利歐正在「往上飛」(速度大於0)，而且瑪利歐的中心點低於方塊的中心點
        if (marioVelocityY > 0 && marioCenterY < blockCenterY) {
            this.hitBlock();
        }
    }

    hitBlock() {
        this.isHit = true; 

        // 方塊的往上彈動畫 (維持原樣，不需要Easing，因為它是剛體)
        cc.tween(this.node)
            .to(0.1, { y: this.startY + 12 }) 
            .to(0.1, { y: this.startY })      
            .call(() => {
                if (this.emptyBlockSprite) {
                    this.getComponent(cc.Sprite).spriteFrame = this.emptyBlockSprite;
                }
                this.spawnItem();
            })
            .start();
    }

    spawnItem() {
        if (this.blockType === BlockType.COIN) {
            this.spawnCoin();
        } else if (this.blockType === BlockType.MUSHROOM) {
            this.spawnMushroom();
        }
    }

    // 🌟 核心大改造：生出金幣與分數文字，並演出扎實、經典的謝幕表演！
    spawnCoin() {
        if (!this.coinPrefab) {
            console.error("你忘記在問號方塊上綁定金幣預製體了！");
            return;
        }

        // --- A. 生出金幣並演出特效 ---
        let coin = cc.instantiate(this.coinPrefab);
        this.node.parent.addChild(coin);
        
        // 讓金幣一開始稍微藏在方塊裡面一點點 (加 8 像素)
        coin.setPosition(this.node.x, this.node.y + 8);

        let coinStartY = coin.y;
        
        cc.tween(coin)
            // 🌟 關鍵修改：最高只往上彈 16 像素 (剛好一格的高度)
            .to(0.2, { y: coinStartY + 16 }, { easing: 'quadOut' }) 
            // 🌟 關鍵修改：掉下來一點點 (掉回 +8 的位置) 並漸隱
            .to(0.15, { y: coinStartY + 8, opacity: 0 }, { easing: 'quadIn' }) 
            .call(() => {
                coin.destroy(); // 特效播完銷毀金幣
            })
            .start();

        // --- B. 生出「100」分數 Label 並演出特效 ---
        if (!this.scoreLabelPrefab) {
            console.warn("你忘記綁定分數文字的預製體了，這會跳過文字彈出效果喔。");
        } else {
            let scoreLabel = cc.instantiate(this.scoreLabelPrefab);
            this.node.parent.addChild(scoreLabel);
            
            // 分數文字的起點設定在方塊正上方一格 (加 16 像素)
            scoreLabel.setPosition(this.node.x, this.node.y + 16);

            let scoreStartY = scoreLabel.y;
            cc.tween(scoreLabel)
                // 🌟 關鍵修改：分數文字也只緩緩飄升 16 像素
                .to(0.4, { y: scoreStartY + 16 }, { easing: 'quintOut' }) 
                .delay(0.2) 
                .to(0.2, { opacity: 0 }) 
                .call(() => scoreLabel.destroy()) 
                .start();
        }

        // --- C. 遙控 UIManager 更新數值 ---
        let cameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera");
        if (cameraNode) {
            let uiManager = cameraNode.getComponent("UIManager");
            if (uiManager) uiManager.addCoin();
        }
    }

    spawnMushroom() {
        console.log("長出蘑菇！準備變大！下一回合我們再來寫這個 AI！");
    }
}