const {ccclass, property} = cc._decorator;

@ccclass
export default class Mario extends cc.Component {

    @property(cc.Float)
    moveSpeed: number = 200;

    @property(cc.Float)
    jumpForce: number = 900; 

    @property(cc.Animation)
    anim: cc.Animation = null;

    @property(cc.Prefab)
    scorePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    score100Prefab: cc.Prefab = null;

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
    
    private targetFlagX: number = 0; 
    private groundY: number = 0; 

    private bigColliderPoints: cc.Vec2[] = [];
    private mainCollider: cc.PhysicsPolygonCollider = null;

    onLoad () {
        this.rigidBody = this.getComponent(cc.RigidBody);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        this.groundY = 64; 

        this.bigColliderPoints = []; 
        let colliders = this.getComponents(cc.PhysicsPolygonCollider);
        
        for (let c of colliders) {
            if (c.tag === 1) { 
                this.mainCollider = c; 
            } else if (c.tag === 2) { 
                // 🌟 終極深拷貝：確認有點才抄，而且是創造全新的座標點！
                if (c.points && c.points.length > 0) {
                    for (let p of c.points) {
                        this.bigColliderPoints.push(cc.v2(p.x, p.y));
                    }
                }
                // 抄完之後徹底刪除大碰撞體
                this.node.removeComponent(c); 
            }
        }
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

        if (velocity.y < -1200) {
            velocity.y = -1200; 
        }

        if (this.isLevelCleared) {
            if (this.isSlidingDown) {
                this.node.x = this.targetFlagX;
                this.node.y -= 180 * dt; 
                velocity.x = 0; velocity.y = 0;

                if (this.node.y <= this.groundY) {
                    this.node.y = this.groundY; 
                    this.isSlidingDown = false;
                    this.isJumpingOff = true;  
                    this.isGrounded = false;

                    this.rigidBody.type = cc.RigidBodyType.Dynamic; 
                    this.node.scaleX = Math.abs(this.node.scaleX); 
                    velocity.x = 100;
                    velocity.y = 400; 
                }
            } else if (this.isJumpingOff) {
                if (this.isGrounded && velocity.y <= 0) {
                    this.isJumpingOff = false;
                    this.isAutoWalking = true;
                }
            } else if (this.isAutoWalking) {
                velocity.x = this.moveSpeed * 0.5; 
                this.node.scaleX = Math.abs(this.node.scaleX);

                if (this.node.x >= this.targetFlagX + 230) {
                    velocity.x = 0;
                    this.isAutoWalking = false;
                    console.log("castle");
                }
            }

            this.rigidBody.linearVelocity = velocity;

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

        if (this.isMovingLeft) velocity.x = -this.moveSpeed;
        else if (this.isMovingRight) velocity.x = this.moveSpeed;
        else velocity.x = 0; 
        this.rigidBody.linearVelocity = velocity;

        // 🚨 這裡已經把原本會引發 Bug 的 for 迴圈 (c.enabled = !this.isBig) 徹底刪除了！

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
        
        if (velocityY > 15) {
            contact.disabled = true;
            return;
        }

        let marioBottom = selfCollider.node.getBoundingBoxToWorld().yMin;
        let boxCollider = otherCollider as cc.PhysicsBoxCollider;
        let blockWorldPos = boxCollider.node.convertToWorldSpaceAR(boxCollider.offset);
        let blockWorldHeight = boxCollider.size.height * Math.abs(boxCollider.node.scaleY);
        let blockTop = blockWorldPos.y + (blockWorldHeight / 2);

        let dynamicTolerance = blockWorldHeight * 0.9; 

        if (marioBottom < blockTop - dynamicTolerance) {
            contact.disabled = true;
        }
    }

    onBeginContact (contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.rigidBody.linearVelocity.y <= 0) {
            this.isGrounded = true;
        }

        if (otherCollider.node.group === "flag" && !this.isLevelCleared) {
            let flagBox = otherCollider.node.getBoundingBoxToWorld();
            let flagWorldBottom = flagBox.yMin;
            let localBottomPoint = this.node.parent.convertToNodeSpaceAR(cc.v2(0, flagWorldBottom));
            let finalBottomY = localBottomPoint.y + (this.node.height * this.node.anchorY) + 16;

            this.scheduleOnce(() => {
                this.levelClear(finalBottomY);
            }, 0);
        }

        // 🍄 吃蘑菇判定
        if (otherCollider.getComponent("Mushroom")) {
            
            // 🌟 核心防護鎖：用 as any 繞過 TS 型別檢查，動態讀取 isEaten 標籤。
            // 如果這顆蘑菇已經被貼上標籤，代表它是 0.001 秒內的重複碰撞，直接無視！
            if ((otherCollider.node as any).isEaten) return;
            
            // 第一時間馬上鎖死！貼上「已吃過」的標籤
            (otherCollider.node as any).isEaten = true;

            this.scheduleOnce(() => {
                if (cc.isValid(otherCollider.node)) {
                    otherCollider.node.destroy(); 
                    this.growBig();               
                    
                    let headPos = cc.v3(this.node.x, this.node.y + 50, 0);
                    this.spawnScoreEffect(headPos, 1000); 
                }
            }, 0);
        }

        // 👿 撞到敵人的判定！
        if (otherCollider.node.group === "enemy") {
            let goomba = otherCollider.getComponent("Goomba");
            if (goomba && goomba.isDead) return;

            let marioBottom = selfCollider.node.getBoundingBoxToWorld().yMin;
            let enemyCenter = otherCollider.node.getBoundingBoxToWorld().center.y;

            if (this.rigidBody.linearVelocity.y < 0 && marioBottom > enemyCenter) {
                if (goomba) goomba.die();

                this.rigidBody.linearVelocity = cc.v2(this.rigidBody.linearVelocity.x, 600);

                // 🌟 終極座標轉換法：
                // 1. 把 Goomba 的相對座標，轉換成整個遊戲世界的「絕對 GPS 座標」
                let worldPos = otherCollider.node.convertToWorldSpaceAR(cc.v2(0, 0));
                
                // 2. 把這個 GPS 座標，轉換成跟瑪利歐同一個圖層的相對座標
                let localPos = this.node.parent.convertToNodeSpaceAR(worldPos);
                
                // 3. 往上提 40 像素，在 Goomba 的頭頂呼叫 100 分特效
                let effectPos = cc.v3(localPos.x, localPos.y + 40, 0);
                this.spawnScoreEffect(effectPos, 100);
                
            } else {
                console.log("阿！瑪利歐被咬到了！");
            }
        }
    }

    growBig() {
        if (this.isBig) return; 

        // 🌟 防護網：如果當初沒抄到大瑪利歐的點，立刻煞車，拒絕執行！
        if (!this.mainCollider || this.bigColliderPoints.length === 0) {
            console.error("警告：沒有抓到大瑪利歐的碰撞體點！請確認編輯器裡大碰撞體有打勾！");
            return; 
        }

        console.log("吃蘑菇！變大啦！");
        this.isBig = true; 

        let smallBottom = Infinity;
        for (let p of this.mainCollider.points) {
            if (p.y < smallBottom) smallBottom = p.y;
        }

        let bigBottom = Infinity;
        for (let p of this.bigColliderPoints) {
            if (p.y < bigBottom) bigBottom = p.y;
        }

        // 🌟 核心魔法：用 map 產生「全新」的點給物理引擎刷新！
        this.mainCollider.points = this.bigColliderPoints.map(p => cc.v2(p.x, p.y));
        this.mainCollider.apply();

        let shiftAmount = smallBottom - bigBottom; 
        this.node.y += shiftAmount; 
    }

    levelClear(bottomY: number) {
        if (this.isLevelCleared) return; 

        this.isLevelCleared = true;
        this.isSlidingDown = true; 
        this.isJumpingOff = false;
        this.isAutoWalking = false;
        this.targetFlagX = 3343.4227791763838;
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

    // 🌟 加上 scoreAmount 參數，讓函數知道現在要加幾分
    spawnScoreEffect(position: cc.Vec3, scoreAmount: number) {
        
        // 根據分數決定要抓哪一個 Prefab
        let prefabToSpawn = (scoreAmount === 1000) ? this.scorePrefab : this.score100Prefab;
        
        if (prefabToSpawn) {
            let scoreNode = cc.instantiate(prefabToSpawn);
            this.node.parent.addChild(scoreNode);
            scoreNode.setPosition(position);

            cc.tween(scoreNode)
                .parallel(
                    cc.tween().by(0.6, { y: 60 }, { easing: 'sineOut' }),
                    cc.tween().delay(0.3).to(0.3, { opacity: 0 }) 
                )
                .removeSelf() 
                .start();
        }

        // 通知 UIManager 加分
        let cameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera") || cc.find("Canvas/world/Main Camera");
        if (cameraNode) {
            let uiManager = cameraNode.getComponent("UIManager");
            if (uiManager && typeof uiManager["addScore"] === "function") {
                uiManager["addScore"](scoreAmount); 
            }
        }
    }
}