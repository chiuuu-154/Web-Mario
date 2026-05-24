const {ccclass, property} = cc._decorator;

@ccclass
export default class MapCollider extends cc.Component {

    onLoad () {
        let tiledMap = this.node.getComponent(cc.TiledMap);
        let tileSize = tiledMap.getTileSize();

        // 1. 生成普通地板 (讀取 top 圖層，放入 default 群組)
        this.createCollidersForLayer(tiledMap, "top", "default", tileSize);
        this.createCollidersForLayer(tiledMap, "toponBlack", "default", tileSize);

        // 2. 生成單向穿透平台 (讀取 oneway 圖層，放入 oneway 群組)
        this.createCollidersForLayer(tiledMap, "oneway", "oneway", tileSize);

        // 3. 終點旗子 
        //this.createCollidersForLayer(tiledMap, "flagBase", "flag", tileSize);
    }

    // 寫一個共用的生成函數，這樣以後你要加冰塊、岩漿圖層都很方便
    createCollidersForLayer(tiledMap: cc.TiledMap, layerName: string, groupName: string, tileSize: cc.Size) {
        let layer = tiledMap.getLayer(layerName);
        if (!layer) return; // 如果沒畫這個圖層就跳過
        
        let layerSize = layer.getLayerSize();

        // 加入剛體
        let rigidBody = layer.node.addComponent(cc.RigidBody);
        rigidBody.type = cc.RigidBodyType.Static;

        // 🌟 核心魔法：強制把這個圖層的「物理群組」改成我們指定的名字
        layer.node.group = groupName;

        // 掃描地磚並加上碰撞框
        for (let x = 0; x < layerSize.width; x++) {
            for (let y = 0; y < layerSize.height; y++) {
                if (layer.getTileGIDAt(x, y) !== 0) {
                    let collider = layer.node.addComponent(cc.PhysicsBoxCollider);
                    collider.size = tileSize;
                    
                    let posX = x * tileSize.width + tileSize.width / 2;
                    let posY = (layerSize.height - y - 1) * tileSize.height + tileSize.height / 2;
                    
                    collider.offset = cc.v2(posX, posY);
                    collider.apply(); 
                }
            }
        }
    }
}