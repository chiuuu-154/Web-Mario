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

    // 🌟 新增：過關謝幕演出狀態機
    private isLevelCleared: boolean = false; // 是否已觸發過關
    private isSlidingDown: boolean = false;  // 是否正在滑旗杆
    private isAutoWalking: boolean = false;   // 是否正在自動走向城堡

    onLoad () {
        this.rigidBody = this.getComponent(cc.RigidBody);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
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
        // 🌟 防呆：過關之後，鍵盤完全失效，不理會玩家操作
        if (this.isLevelCleared) return;

        let currentScale = Math.abs(this.node.scaleX);

        switch(event.keyCode) {
            case cc.macro.KEY.a:
                this.isMovingLeft = true;
                this.isMoving = true; 
                this.node.scaleX = -currentScale; 
                break;
            case cc.macro.KEY.d:
                this.isMovingRight = true;
                this.isMoving = true; 
                this.node.scaleX = currentScale;  
                break;
            case cc.macro.KEY.k:
                this.jump();
                break;
        }
    }

    onKeyUp (event: cc.Event.EventKeyboard) {
        // 🌟 防呆：過關之後，鍵盤完全失效
        if (this.isLevelCleared) return;

        switch(event.keyCode) {
            case cc.macro.KEY.a:
                this.isMovingLeft = false;
                break;
            case cc.macro.KEY.d:
                this.isMovingRight = false;
                break;
            case cc.macro.KEY.k:
                let velocity = this.rigidBody.linearVelocity;
                if (velocity.y > 0) {
                    velocity.y = velocity.y * 0.5; 
                    this.rigidBody.linearVelocity = velocity;
                }
                break;
        }

        if (!this.isMovingLeft && !this.isMovingRight) {
            this.isMoving = false;
        }
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

        // ====================================================
        // 🌟 【核心修改】過關自動演出電影模式
        // ====================================================
        if (this.isLevelCleared) {
            if (this.isSlidingDown) {
                velocity.x = 0;
                velocity.y = -120; // 核心魔法：無視重力，強迫以固定速度滑下去
                
                // 觸底判定：如果腳踩到地了
                if (this.isGrounded) {
                    this.isSlidingDown = false;
                    this.isAutoWalking = true; // 切換成自動散步狀態
                    velocity.y = 0;
                }
            } else if (this.isAutoWalking) {
                // 核心魔法：瑪利歐靈魂附體，自己轉向右邊，慢慢走向城堡
                let currentScale = Math.abs(this.node.scaleX);
                this.node.scaleX = currentScale; // 確保面向右邊
                
                velocity.x = this.moveSpeed * 0.5; // 速度砍半，優雅地散步
                // y 軸此時留給正常重力，確保如果前方有階梯他能正常走下去
            } else {
                velocity.x = 0;
            }
            this.rigidBody.linearVelocity = velocity;

            // 過關後的動畫狀態機管理
            let targetAnim = "";
            if (this.isSlidingDown) {
                targetAnim = this.getAnimName("slide"); // 組合出 "MarioSmall_slide"
            } else if (this.isAutoWalking) {
                targetAnim = this.getAnimName("walk");  // 組合出 "MarioSmall_walk"
            } else {
                targetAnim = this.getAnimName("idle");  // 組合出 "MarioSmall_idle"
            }

            if (this.currentAnim !== targetAnim) {
                let state = this.anim.getAnimationState(targetAnim);
                if (state) {
                    this.anim.play(targetAnim);
                } else {
                    // 防呆：如果你還沒做 slide 動畫，這裡會自動定格，看起來也會非常自然！
                    this.anim.stop(); 
                }
                this.currentAnim = targetAnim;
            }

            return; // 🌟 執行完謝幕演出，直接中斷 update，絕對不讓玩家鍵盤控制干擾
        }

        // === 1. 正常遊戲：物理移動計算 ===
        if (this.isMovingLeft) {
            velocity.x = -this.moveSpeed;
        } else if (this.isMovingRight) {
            velocity.x = this.moveSpeed;
        } else {
            velocity.x = 0; 
        }
        this.rigidBody.linearVelocity = velocity;

        // === 2. 正常遊戲：動畫狀態機判斷 ===
        let targetAnim = "";

        if (!this.isGrounded) {
            targetAnim = this.getAnimName("jump"); 
        } else if (this.isMoving) {
            targetAnim = this.getAnimName("walk"); 
        } else {
            targetAnim = this.getAnimName("idle"); 
        }

        if (this.currentAnim !== targetAnim) {
            let state = this.anim.getAnimationState(targetAnim);
            if (state) {
                this.anim.play(targetAnim);
            } else {
                this.anim.stop();
            }
            this.currentAnim = targetAnim;
        }
    }

    // 2.5D 精准碰撞修正 (保留原有的完美程式碼)
    onPreSolve (contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (otherCollider.node.group !== "oneway") return;

        let velocityY = this.rigidBody.linearVelocity.y;
        let marioBox = selfCollider.node.getBoundingBoxToWorld();
        let blockBox = otherCollider.node.getBoundingBoxToWorld();

        let marioBottom = marioBox.yMin;
        let blockTop = blockBox.yMax;

        if (velocityY > 15) {
            contact.disabled = true;
            return;
        }

        let blockWorldHeight = blockBox.height; 
        let dynamicTolerance = blockWorldHeight * 0.8;

        if (marioBottom < blockTop - dynamicTolerance) {
            contact.disabled = true;
        }
    }

    onBeginContact (contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.rigidBody.linearVelocity.y <= 0) {
            this.isGrounded = true;
        }

        // 撞旗子 / 旗桿判定！
        if (otherCollider.node.group === "flag" && !this.isLevelCleared) {
            this.levelClear(); 
        }
    }

    levelClear() {
        this.isLevelCleared = true;
        this.isSlidingDown = true; // 啟動滑行模式！
        this.isAutoWalking = false;

        // 沒收玩家控制
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.isMoving = false;

        // 給予一個初始的下滑速度
        let velocity = this.rigidBody.linearVelocity;
        velocity.x = 0;
        velocity.y = -120;
        this.rigidBody.linearVelocity = velocity;

        // 遙控 UIManager 停止計時
        let uiManagerNode = cc.find("Canvas/Main Camera");
        if (uiManagerNode) {
            let uiManager = uiManagerNode.getComponent("UIManager");
            if (uiManager) {
                uiManager.stopTimer();
                console.log("過關啦！時間停止！");
            }
        }
    }
}