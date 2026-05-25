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

    @property(cc.Node)
    marioSprite: cc.Node = null;

    @property({type: cc.Float, tooltip: "大馬力歐視覺圖片 Y 軸修正量"})
    bigMarioVisualOffsetY: number = 0;

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

    private smallColliderPoints: cc.Vec2[] = []; 
    private mainCollider: cc.PhysicsPolygonCollider = null;

    private isInvincible: boolean = false;

    private mainCollider: cc.PhysicsPolygonCollider = null;

    // 🌟 新增這行：記住 MarioSprite 最初在場景上的 Scale
    private baseScale: cc.Vec2 = cc.v2(1, 1);

    onLoad () {
        this.rigidBody = this.getComponent(cc.RigidBody);
        // 🌟 抄下子節點的初始比例 (這樣你在編輯器怎麼調，程式都會自動配合)
        if (this.marioSprite) {
            this.baseScale = cc.v2(this.marioSprite.scaleX, this.marioSprite.scaleY);
        }
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        this.groundY = 64; 

        this.bigColliderPoints = []; 
        this.smallColliderPoints = []; // 🌟 初始化

        let colliders = this.getComponents(cc.PhysicsPolygonCollider);
        
        for (let c of colliders) {
            if (c.tag === 1) { 
                this.mainCollider = c; 
                // 🌟 把小隻的形狀也備份下來！
                if (c.points && c.points.length > 0) {
                    for (let p of c.points) {
                        this.smallColliderPoints.push(cc.v2(p.x, p.y));
                    }
                }
            } else if (c.tag === 2) { 
                if (c.points && c.points.length > 0) {
                    for (let p of c.points) {
                        this.bigColliderPoints.push(cc.v2(p.x, p.y));
                    }
                }
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
                this.takeDamage();
            }
        }
    }

    growBig() {
        if (this.isBig) return;
        this.isBig = true;

        // 🌟 修正：多傳入一個目標 Y 座標參數 (bigMarioVisualOffsetY)
        this.stepFlashScale(this.baseScale, this.bigMarioVisualOffsetY, () => {
            // 1. 切換成大瑪利歐的動畫！(請把名稱換成你實際的大隻動畫)
            let anim = this.marioSprite.getComponent(cc.Animation);
            if (anim) anim.play("Mario_Big_Idle"); // 替換成你的大隻動畫名稱
            
            // 2. 切換物理碰撞體為大隻
            if (this.mainCollider && this.bigColliderPoints.length > 0) {
                this.mainCollider.points = this.bigColliderPoints.map(p => cc.v2(p.x, p.y));
                this.mainCollider.apply();
            }
        });
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

    takeDamage() {
        if (this.isInvincible || this.isLevelCleared) return;

        if (this.isBig) {
            this.isBig = false;
            
            // 🌟 修正：目標 Y 座標要變回小馬力歐的 0
            this.stepFlashScale(this.baseScale, 0, () => {
                // 1. 切換回小瑪利歐的動畫！(請把名稱換成你實際的小隻動畫)
                let anim = this.marioSprite.getComponent(cc.Animation);
                if (anim) anim.play("Mario_Small_Idle"); // 替換成你的小隻動畫名稱
                
                // 2. 切換物理碰撞體為小隻
                if (this.mainCollider && this.smallColliderPoints.length > 0) {
                    this.mainCollider.points = this.smallColliderPoints.map(p => cc.v2(p.x, p.y));
                    this.mainCollider.apply();
                }
            });

        } else {
            this.marioDie();
        }
    }

    private invincibleTween: cc.Tween = null; // 用來記錄當前的 Tween，防止重複觸發

    // 🌟 升級版：定格閃爍縮放總管 (現在支援同時控制 Scale 和 Position Y)
    // 參數：targetScale: 目標縮放, targetY: 目標 Y 座標, onCompleteCallback: 完成後要做的事
    stepFlashScale(targetScale: cc.Vec2, targetY: number, onCompleteCallback: Function = null) {
        if (!this.marioSprite) return;
        if (this.invincibleTween) this.invincibleTween.stop();
        this.isInvincible = true;

        // 取得當前的 Scale 和 Y 座標
        let currentScale = cc.v2(this.marioSprite.scaleX, this.marioSprite.scaleY);
        let currentY = this.marioSprite.y; // 抄下目前的 Y 座標
        
        const flashCount = 4;
        const stepTime = 0.08;
        let t = cc.tween(this.marioSprite);

        for (let i = 1; i <= flashCount; i++) {
            let ratio = i / flashCount;
            // 階段性算出當前的 Scale
            let stepScale = cc.v2(
                cc.misc.lerp(currentScale.x, targetScale.x, ratio),
                cc.misc.lerp(currentScale.y, targetScale.y, ratio)
            );
            // 🌟 階段性算出當前的 Y 座標
            let stepY = cc.misc.lerp(currentY, targetY, ratio);

            // 定格閃爍邏輯：
            t.to(stepTime, { opacity: 0, scaleX: stepScale.x, scaleY: stepScale.y, y: stepY }) // 閃隱 + 變大 + 搬移Y
             .to(stepTime, { opacity: 255 }); // 閃現
        }

        this.invincibleTween = t
            .call(() => {
                this.isInvincible = false;
                this.marioSprite.opacity = 255;
                this.invincibleTween = null;
                if (onCompleteCallback) onCompleteCallback(); 
            })
            .start();
    }

    // 🌟 瑪利歐死亡演出
    marioDie() {
        console.log("Game Over！瑪利歐死掉了！");
        this.isLevelCleared = true; // 借用這個變數來鎖死玩家的操作

        this.scheduleOnce(() => {
            // 1. 關閉碰撞體，讓他掉出世界
            if (this.mainCollider) this.mainCollider.enabled = false;
            
            // 2. 經典死亡彈跳 (往上彈一下然後掉進深淵)
            this.rigidBody.linearVelocity = cc.v2(0, 800);
            
            // 3. 2 秒後重新載入當前場景 (復活)
            this.scheduleOnce(() => {
                cc.director.loadScene(cc.director.getScene().name);
            }, 2);
        }, 0);
    }
}