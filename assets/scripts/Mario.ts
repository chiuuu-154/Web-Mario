const {ccclass, property} = cc._decorator;

@ccclass
export default class Mario extends cc.Component {

    @property(cc.Float)
    moveSpeed: number = 200;

    @property(cc.Float)
    jumpForce: number = 900; 

    @property(cc.Animation)
    anim: cc.Animation = null;

    private rigidBody: cc.RigidBody = null;
    
    // 移動與物理狀態
    private isMovingLeft: boolean = false;
    private isMovingRight: boolean = false;
    private isGrounded: boolean = false;
    
    // 動畫相關狀態
    private isMoving: boolean = false; 
    private currentAnim: string = "";
    private isBig: boolean = false; 

    // 過關謝幕演出狀態機
    private isLevelCleared: boolean = false; 
    private isSlidingDown: boolean = false;  
    private isAutoWalking: boolean = false; 
    private isJumpingOff: boolean = false;  
    
    // 🌟 新增：用來記錄滑行目標位置的變數
    private targetFlagX: number = 0; 
    private groundY: number = 0; // 地面的 Y 座標基準（你可以根據你地圖的最底層地板高度調整，例如 64 像素高）

    onLoad () {
        this.rigidBody = this.getComponent(cc.RigidBody);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        
        // 🌟 自動抓取你第一層地板的大概高度（防呆用，通常 Tiled 第一格地磚 Y 在 32~64 左右）
        // 如果你發現瑪利歐滑得不夠低就開始走路，可以把這行手動改成固定數字，例如 this.groundY = 100;
        this.groundY = 64; 
    }

    onDestroy () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    private getAnimName(action: string): string {
        let sizePrefix = this.isBig ? "MarioBig_" : "MarioSmall_";
        return sizePrefix + action; 
    }

    onKeyDown (event: cc.Event.EventKeyboard) {
        if (this.isLevelCleared) return;
        let currentScale = Math.abs(this.node.scaleX);
        switch(event.keyCode) {
            case cc.macro.KEY.a: this.isMovingLeft = true; this.isMoving = true; this.node.scaleX = -currentScale; break;
            case cc.macro.KEY.d: this.isMovingRight = true; this.isMoving = true; this.node.scaleX = currentScale; break;
            case cc.macro.KEY.k: this.jump(); break;
        }
    }

    onKeyUp (event: cc.Event.EventKeyboard) {
        if (this.isLevelCleared) return;
        switch(event.keyCode) {
            case cc.macro.KEY.a: this.isMovingLeft = false; break;
            case cc.macro.KEY.d: this.isMovingRight = false; break;
            case cc.macro.KEY.k:
                let velocity = this.rigidBody.linearVelocity;
                if (velocity.y > 0) {
                    velocity.y = velocity.y * 0.5; 
                    this.rigidBody.linearVelocity = velocity;
                }
                break;
        }
        if (!this.isMovingLeft && !this.isMovingRight) this.isMoving = false;
    }

    jump () {
        if (this.isGrounded) {
            this.isGrounded = false;
            let velocity = this.rigidBody.linearVelocity;
            velocity.y = this.jumpForce;
            this.rigidBody.linearVelocity = velocity;
        }
    }

    update (dt) {
        let velocity = this.rigidBody.linearVelocity;

        if (velocity.y < -500) {
            velocity.y = -500; 
        }

        // ====================================================
        // 🌟 終極還原：瑪利歐電影謝幕模式 (滑降 -> 小跳 -> 散步)
        // ====================================================
        if (this.isLevelCleared) {
            
            if (this.isSlidingDown) {
                
                // 1. 鎖死 X 座標，讓他黏在碰到旗桿的那個位置
                this.node.x = this.targetFlagX;
                
                // 2. 強制往下移動 (無視物理引擎)
                this.node.y -= 180 * dt; 
                velocity.x = 0; velocity.y = 0;

                // 3. 動態判定：有沒有滑到「旗桿的最底部」？
                if (this.node.y <= this.groundY) {
                    this.node.y = this.groundY; // 對齊底部防穿圖
                    
                    // 🌟 狀態切換：滑到底了，準備往右跳！
                    this.isSlidingDown = false;
                    this.isJumpingOff = true;  // 開啟小跳躍狀態
                    this.isGrounded = false;

                    // 喚醒物理引擎，讓他可以自然落地
                    this.rigidBody.type = cc.RigidBodyType.Dynamic; 
                    
                    // 強制轉向右邊，並給予一個往右上的「小跳躍力道」
                    this.node.scaleX = Math.abs(this.node.scaleX); 
                    velocity.x = 100;
                    velocity.y = 400; 
                }

            } else if (this.isJumpingOff) {
                // 🌟 等待小跳躍落地
                // 當他跳出旗桿且重力讓他落地 (y速度<=0) 時，切換成走路
                if (this.isGrounded && velocity.y <= 0) {
                    this.isJumpingOff = false;
                    this.isAutoWalking = true;
                }

            } else if (this.isAutoWalking) {
                // 🌟 優雅地走向城堡
                velocity.x = this.moveSpeed * 0.5; 
                this.node.scaleX = Math.abs(this.node.scaleX);

                // 走到定點就停下來 (假設城堡在旗桿右邊 300 像素)
                if (this.node.x >= this.targetFlagX + 230) {
                    velocity.x = 0;
                    this.isAutoWalking = false;
                    console.log("castle");
                }
            }

            this.rigidBody.linearVelocity = velocity;

            // 動態動畫切換
            let targetAnim = "";
            if (this.isSlidingDown) targetAnim = this.getAnimName("slide"); 
            else if (this.isJumpingOff) targetAnim = this.getAnimName("jump"); 
            else if (this.isAutoWalking) targetAnim = this.getAnimName("walk");  
            else targetAnim = this.getAnimName("idle");  

            if (this.currentAnim !== targetAnim) {
                let state = this.anim.getAnimationState(targetAnim);
                if (state) this.anim.play(targetAnim);
                else this.anim.stop();
                this.currentAnim = targetAnim;
            }
            return; 
        }

        // === 以下為正常遊戲物理移動 ===
        if (this.isMovingLeft) velocity.x = -this.moveSpeed;
        else if (this.isMovingRight) velocity.x = this.moveSpeed;
        else velocity.x = 0; 
        this.rigidBody.linearVelocity = velocity;

        let targetAnim = "";
        if (!this.isGrounded) targetAnim = this.getAnimName("jump"); 
        else if (this.isMoving) targetAnim = this.getAnimName("walk"); 
        else targetAnim = this.getAnimName("idle"); 

        if (this.currentAnim !== targetAnim) {
            let state = this.anim.getAnimationState(targetAnim);
            if (state) this.anim.play(targetAnim);
            else this.anim.stop();
            this.currentAnim = targetAnim;
        }
    }

    onPreSolve (contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        
        if (otherCollider.node.group !== "oneway") return;

        let velocityY = this.rigidBody.linearVelocity.y;
        
        // 往上跳時無條件穿透
        if (velocityY > 15) {
            contact.disabled = true;
            return;
        }

        let marioBottom = selfCollider.node.getBoundingBoxToWorld().yMin;
        let boxCollider = otherCollider as cc.PhysicsBoxCollider;
        let blockWorldPos = boxCollider.node.convertToWorldSpaceAR(boxCollider.offset);
        let blockWorldHeight = boxCollider.size.height * Math.abs(boxCollider.node.scaleY);
        let blockTop = blockWorldPos.y + (blockWorldHeight / 2);

        // 🌟 換回最穩定的「高度比例包容網」(0.9 代表包容方塊 90% 的高度)
        // 因為有了上面的「終端速度」保護，這個網子絕對接得住他！
        let dynamicTolerance = blockWorldHeight * 0.9; 

        if (marioBottom < blockTop - dynamicTolerance) {
            contact.disabled = true;
        }
    }

    onBeginContact (contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.rigidBody.linearVelocity.y <= 0) {
            this.isGrounded = true;
        }

        // 撞旗子判定！
        if (otherCollider.node.group === "flag" && !this.isLevelCleared) {
                
            
            // 🌟 核心魔法：動態計算旗桿「最底部」的精準 Y 座標！
            let flagBox = otherCollider.node.getBoundingBoxToWorld();
            let flagWorldBottom = flagBox.yMin;
            // 將世界座標轉換回瑪利歐所在節點的相對座標
            let localBottomPoint = this.node.parent.convertToNodeSpaceAR(cc.v2(0, flagWorldBottom));
            
            // 加上瑪利歐身高的微調 (大約 16~20 像素)，確保他腳踩在方塊上而不是插進去
            let finalBottomY = localBottomPoint.y + (this.node.height * this.node.anchorY) + 16;

            this.scheduleOnce(() => {
                this.levelClear(finalBottomY);
            }, 0);
        }

        // 🍄 吃蘑菇判定
        if (otherCollider.getComponent("Mushroom")) {
            
            // 避開物理引擎鎖定
            this.scheduleOnce(() => {
                
                // 🌟 加上終極保護傘：確認這顆蘑菇還「活著」，才執行吃掉的動作！
                if (cc.isValid(otherCollider.node)) {
                    otherCollider.node.destroy(); // 銷毀蘑菇
                    this.growBig();               // 變大！
                }
                
            }, 0);
        }
    }

    growBig() {
        // 如果已經是大的了，就不執行
        if (this.isBig) return; 

        console.log("吃蘑菇！變大啦！");
        this.isBig = true; 

        let collider = this.getComponent(cc.PhysicsBoxCollider);
        
        if (collider) {
            let oldHeight = collider.size.height; // 小身高 (假設 16)
            let newHeight = oldHeight * 2;        // 大身高 (假設 32)

            // 🌟 核心修正魔法：計算高度差的一半，這是我們唯一的修正基準！
            // (32 - 16) / 2 = 8 像素
            let shiftAmount = (newHeight - oldHeight) / 2; 

            // ===================================================
            // 🌟 A. 物理修正 (維持原樣，但用 shiftAmount 統一計算)
            // ===================================================
            collider.size.height = newHeight;
            collider.offset.y += shiftAmount; // 物理中心點往上提 8
            collider.apply();

            // ===================================================
            // 🌟 B. 視覺精準修正 (解決 image_3.png 埋入問題！)
            // ===================================================
            // 既然我們把物理身體往上提了 8，
            // 我們就也強制把整個人視覺上「也往上提 8 像素」！
            // 這樣絕對不會有依賴 Sprite 高度延遲讀取的問題！
            this.node.y += shiftAmount; // 強行把節點往上提 8
        }
    }

    levelClear(bottomY: number) {
        if (this.isLevelCleared) return; 

        this.isLevelCleared = true;
        this.isSlidingDown = true; 
        
        this.isJumpingOff = false;
        this.isAutoWalking = false;

        this.targetFlagX = 3343.4227791763838;
        
        // 🌟 我們絕對「不去動他的 Y 座標」，讓他完美停在碰到的那個高度！
        // 取而代之的是，我們把剛剛算好的「旗桿最底端高度」存起來，當作煞車點
        this.groundY = bottomY;

        if (this.rigidBody) {
            this.rigidBody.type = cc.RigidBodyType.Kinematic;
            this.rigidBody.linearVelocity = cc.v2(0, 0); 
        }

        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.isMoving = false;

        let cameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera") || cc.find("Canvas/world/Main Camera");
        if (cameraNode) {
            let uiManager = cameraNode.getComponent("UIManager");
            if (uiManager) uiManager.stopTimer();
        }
    }
}