const {ccclass, property} = cc._decorator;

@ccclass
export default class Goomba extends cc.Component {

    @property(cc.Float)
    moveSpeed: number = 80; // 栗寶寶的移動速度

    private rigidBody: cc.RigidBody = null;
    private direction: number = -1; // -1 表示往左走，1 表示往右走
    public isDead: boolean = false;

    onLoad () {
        this.rigidBody = this.getComponent(cc.RigidBody);
    }

    update (dt) {
        // 🌟 新增：如果已經被踩死了，就立刻停止運作，不要再給他速度！
        if (this.isDead) return;

        // 1. 取得當前的物理速度
        let velocity = this.rigidBody.linearVelocity;
        
        // 2. 鎖定 X 軸速度，讓他保持等速移動 (這行寫得很棒！)
        velocity.x = this.direction * this.moveSpeed;

        // 3. 防呆機制：掉進坑裡自我銷毀
        if (this.node.y < -200) {
            this.node.destroy();
            return;
        }

        // 4. 套用速度
        this.rigidBody.linearVelocity = velocity;
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // 1. 死掉就不用判斷撞牆了
        if (this.isDead) return;

        // 2. 取得撞擊的法向量 (找出是撞到哪一面)
        let normal = contact.getWorldManifold().normal;

        // 3. 🌟 防卡牆核心：如果法向量的 X 絕對值大於 0.5，代表撞到左邊或右邊的牆壁！
        if (Math.abs(normal.x) > 0.5) {
            
            // 把方向反轉！(如果是 1 就變 -1，如果是 -1 就變 1)
            this.direction = -this.direction; 
            
        }
    }

    public die() {
        if (this.isDead) return;
        this.isDead = true;

        // 🌟 核心解法：把會改變物理狀態的程式碼，包在 scheduleOnce 裡面！
        // 這樣引擎就會在「下一幀（物理計算結束後）」才執行它，完美避開報錯。
        this.scheduleOnce(() => {
            // 1. 煞車並把剛體變成 Static
            if (this.rigidBody) {
                this.rigidBody.type = cc.RigidBodyType.Static;
                this.rigidBody.linearVelocity = cc.v2(0, 0);
            }

            // 2. 拔除碰撞體
            let collider = this.getComponent(cc.PhysicsBoxCollider);
            if (collider) collider.enabled = false;
        }, 0);

        // 3. 動畫播放 (這不影響物理計算，可以馬上播)
        let anim = this.getComponentInChildren(cc.Animation);
        if (anim) {
            anim.play("Goomba_die"); 
        }

        // 4. 0.5 秒後徹底銷毀節點
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 0.5);
    }
}