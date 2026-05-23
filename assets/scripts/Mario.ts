const {ccclass, property} = cc._decorator;

@ccclass
export default class Mario extends cc.Component {

    @property(cc.Float)
    moveSpeed: number = 200;

    @property(cc.Float)
    jumpForce: number = 900; // 記得配合調整過的 Gravity Scale (例如 3 或 4)

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
    private isBig: boolean = false; // 預設為小瑪利歐

    onLoad () {
        this.rigidBody = this.getComponent(cc.RigidBody);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    // 動畫名稱產生器 (組合出 MarioSmall_walk, MarioSmall_idle 等名稱)
    private getAnimName(action: string): string {
        let sizePrefix = this.isBig ? "MarioBig_" : "MarioSmall_";
        return sizePrefix + action; 
    }

    onKeyDown (event: cc.Event.EventKeyboard) {
        // 抓出瑪利歐現在「真正的寬度大小」，確保比例不會跑掉
        let currentScale = Math.abs(this.node.scaleX);

        switch(event.keyCode) {
            case cc.macro.KEY.a:
                this.isMovingLeft = true;
                this.isMoving = true; // 啟動走路動畫判定
                this.node.scaleX = -currentScale; // 轉向左邊
                break;
            case cc.macro.KEY.d:
                this.isMovingRight = true;
                this.isMoving = true; // 啟動走路動畫判定
                this.node.scaleX = currentScale;  // 轉向右邊
                break;
            case cc.macro.KEY.k:
                this.jump();
                break;
        }
    }

    onKeyUp (event: cc.Event.EventKeyboard) {
        switch(event.keyCode) {
            case cc.macro.KEY.a:
                this.isMovingLeft = false;
                break;
            case cc.macro.KEY.d:
                this.isMovingRight = false;
                break;
            
            // 完美保留：瑪利歐的「斷跳」魔法
            case cc.macro.KEY.k:
                let velocity = this.rigidBody.linearVelocity;
                // 如果玩家放開按鍵時，瑪利歐還在「往上飛」
                if (velocity.y > 0) {
                    velocity.y = velocity.y * 0.5; // 動能砍半
                    this.rigidBody.linearVelocity = velocity;
                }
                break;
        }

        // 檢查是否 A 和 D 鍵都放開了，用來讓走路動畫停下來
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
        // === 1. 物理移動計算 ===
        let velocity = this.rigidBody.linearVelocity;
        if (this.isMovingLeft) {
            velocity.x = -this.moveSpeed;
        } else if (this.isMovingRight) {
            velocity.x = this.moveSpeed;
        } else {
            velocity.x = 0; // 沒按鍵時停止滑行
        }
        this.rigidBody.linearVelocity = velocity;

        // === 2. 動畫狀態機判斷 ===
        let targetAnim = "";

        if (!this.isGrounded) {
            targetAnim = this.getAnimName("jump"); // 組合出 "MarioSmall_jump"
        } else if (this.isMoving) {
            targetAnim = this.getAnimName("walk"); // 組合出 "MarioSmall_walk"
        } else {
            targetAnim = this.getAnimName("idle"); // 組合出 "MarioSmall_idle"
        }

        // 如果算出的動畫跟目前播的不一樣，就切換
        if (this.currentAnim !== targetAnim) {
            // 防呆機制：確認動畫組件裡面真的有這個 Clip 才播放
            let state = this.anim.getAnimationState(targetAnim);
            if (state) {
                this.anim.play(targetAnim);
            } else {
                // 如果找不到對應的 Clip (例如還沒做 idle)，就先停止動畫，停在第一格
                this.anim.stop();
            }
            this.currentAnim = targetAnim;
        }
    }

    onBeginContact (contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.rigidBody.linearVelocity.y <= 0) {
            this.isGrounded = true;
        }
    }
}