import UIManager from "./UIManager"; // 🌟 請確保有這行，路徑根據你的專案調整
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

    @property(cc.Node)
    gameStartScreen: cc.Node = null; // 🌟 記得把 Canvas 底下的 gameStartScreen 拖進來

    public static lives: number = 5;

    private isControllable: boolean = false; // 控管開場時能不能操作瑪利歐
    private isDead: boolean = false;

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

    start() {
        // 🌟 2. 核心開場邏輯：不論是第一次進關卡還是死掉重開，都會觸發 start()
        if (this.gameStartScreen) {
            this.gameStartScreen.active = true;
            this.isControllable = false; // 鎖定操作，不讓玩家在黑底畫面時偷跑

            // 更新黑底畫面上的生命值數字 (假設你裡面有一個叫 LifeLabel 的 Node)
            let labelNode = this.gameStartScreen.getChildByName("LifeLabel");
            if (labelNode) {
                labelNode.getComponent(cc.Label).string = "x " + Mario.lives;
            }

            // 2 秒後，關閉黑底過場，解放瑪利歐的操作權！
            this.scheduleOnce(() => {
                this.gameStartScreen.active = false;
                this.isControllable = true; 
            }, 2.0);
        } else {
            this.isControllable = true;
        }

        // 🌟 新增：遊戲開局時，通知 UIManager 顯示目前的生命值！
        let cameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera");
        if (cameraNode) {
            let uiManager = cameraNode.getComponent("UIManager");
            if (uiManager) {
                uiManager.updateLife(Mario.lives);
            }
        }
    }

    onLoad () {
        console.log(this.node.y);
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
        //this.mainCollider.points = this.smallColliderPoints.map(p => cc.v2(p.x, p.y-16));
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

        if (!this.isControllable || this.isDead) return;

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

        // 🌟 3. 新增：最左邊界限制 (假設地圖最左邊座標是 X = 0)
        if (this.node.x <= -480) {
            this.node.x = -480; 
        }

        // 🌟 4. 新增：掉進地底下 (outofbound) 判定
        // 假設你的地平線在 0 附近，深坑掉到 Y = -200 以下就判定死亡
        if (this.node.y < -320) {
            console.log(this.node.y);
            this.marioDie();
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

            // 🌟 新增：特例判定！如果是食人花，不管怎樣絕對是瑪利歐受傷！
            if (otherCollider.getComponent("Piranha")) {
                this.takeDamage();
                return; // 直接中斷，不要執行後面的踩踏判定
            }

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

    /*growBig() {
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
    }*/

    growBig() {
        if (this.isBig) return;
        this.isBig = true;

        // 1. 馬上換成「大瑪利歐」的動畫
        let anim = this.marioSprite.getComponent(cc.Animation);
        if (anim) anim.play("Mario_Big_Idle"); 

        // 2. 馬上換成大隻的物理碰撞體 (避開物理鎖死)
        this.scheduleOnce(() => {
            if (this.mainCollider && this.bigColliderPoints.length > 0) {
                this.mainCollider.points = this.bigColliderPoints.map(p => cc.v2(p.x, p.y));
                this.mainCollider.apply();
            }
        }, 0);

        // 3. 視覺特效：把大瑪利歐的圖片 Y 軸先壓扁一半，然後閃爍長高到原本的大小！
        let startScale = cc.v2(this.baseScale.x, this.baseScale.y * 0.5); 
        this.stepFlashScale(startScale, this.baseScale);
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

    /*takeDamage() {
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
    }*/

    takeDamage() {
        if (this.isInvincible || this.isLevelCleared) return;
        if (this.isBig) {
            this.isBig = false;
            
            // 1. 馬上換成「小瑪利歐」的動畫
            let anim = this.marioSprite.getComponent(cc.Animation);
            if (anim) anim.play("Mario_Small_Idle"); 
            
            // 2. 馬上換成小隻的物理碰撞體
            this.scheduleOnce(() => {
                if (this.mainCollider && this.smallColliderPoints.length > 0) {
                    this.mainCollider.points = this.smallColliderPoints.map(p => cc.v2(p.x, p.y-16));
                    this.mainCollider.apply();
                }
            }, 0);

            // 3. 視覺特效：把小瑪利歐的圖片 Y 軸先拉長 1.5 倍，然後閃爍縮回原本的大小！
            let startScale = cc.v2(this.baseScale.x, this.baseScale.y * 1.5);
            this.stepFlashScale(startScale, this.baseScale);
        } else {
            this.marioDie();
        }
    }

    private invincibleTween: cc.Tween = null; // 用來記錄當前的 Tween，防止重複觸發

    /*// 🌟 升級版：定格閃爍縮放總管 (現在支援同時控制 Scale 和 Position Y)
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
    }*/

    stepFlashScale(startScale: cc.Vec2, targetScale: cc.Vec2) {
        if (!this.marioSprite) return;
        if (this.invincibleTween) this.invincibleTween.stop();
        this.isInvincible = true;
        
        const flashCount = 4;
        const stepTime = 0.08;
        let t = cc.tween(this.marioSprite);

        for (let i = 1; i <= flashCount; i++) {
            let ratio = i / flashCount;
            let stepScale = cc.v2(
                cc.misc.lerp(startScale.x, targetScale.x, ratio),
                cc.misc.lerp(startScale.y, targetScale.y, ratio)
            );
            // 只有縮放跟閃爍，沒有 Y 的位移！
            t.to(stepTime, { opacity: 0, scaleX: stepScale.x, scaleY: stepScale.y }) 
             .to(stepTime, { opacity: 255 }); 
        }

        this.invincibleTween = t
            .call(() => {
                this.isInvincible = false;
                this.marioSprite.opacity = 255;
                this.invincibleTween = null;
            })
            .start();
    }

    marioDie() {
        if (this.isDead) return;
        this.isDead = true;
        this.isControllable = false; // 斷開操作

        console.log("馬力歐死亡！");
        this.isLevelCleared = true; // 借用這個變數來鎖死玩家的操作

        let anim = this.marioSprite.getComponent(cc.Animation);

        if (anim) {
            if (this.isBig) {
                anim.play("MarioBig_die");
            } else {
                anim.play("MarioSmall_die");
            }
        }

        // 扣除生命值
        Mario.lives--;
        console.log("剩餘生命：", Mario.lives);

        // 🌟 新增：剛死掉扣完命的瞬間，通知 UIManager 更新畫面！
        let cameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera");
        if (cameraNode) {
            let uiManager = cameraNode.getComponent("UIManager");
            if (uiManager) {
                uiManager.updateLife(Mario.lives);
            }
        }

        this.scheduleOnce(() => {
            // 1. 關閉碰撞體，讓他掉出世界
            if (this.mainCollider) this.mainCollider.enabled = false;
            
            // 2. 經典死亡彈跳 (往上彈一下然後掉進深淵)
            this.rigidBody.linearVelocity = cc.v2(0, 800);
            
            // 2 秒後執行：重新載入 或 Game Over
            this.scheduleOnce(() => {
                
                if (Mario.lives > 0) {
                    // 【狀況 A】還有命：重新載入當前場景
                    // (因為換成了靜態變數，這時候重載場景，金幣跟分數會完美留著！)
                    cc.director.loadScene(cc.director.getScene().name);
                } else {
                    // 【狀況 B】沒命了：Game Over，跳回關卡選擇畫面
                    console.log("GAME OVER！");
                    
                    Mario.lives = 3; // 把生命值補滿
                    
                    // 🌟 核心新增：只有在這裡，生命真正歸零的時候，才呼叫 UIManager 把金幣分數清空！
                    UIManager.resetData(); 
                    
                    cc.director.loadScene("levelSelect"); 
                }
                
            }, 2);
        }, 0);
    }
}